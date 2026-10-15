/**
 * 运行时密码同步（由 Cloudflare Dashboard「运行时变量和密钥」驱动）。
 *
 * 支持两个可选密钥：
 *
 * 1. `ADMIN_PASSWORD`：单一管理员密码，同步到 ADMIN_EMAIL 账户（超管恢复通道）。
 *    同步时会把该账户修正为 role=admin、解封（与 scripts/reset-admin-password.mjs 一致）。
 *
 * 2. `USER_PASSWORDS`：JSON 对象，键为邮箱、值为密码，批量设置任意用户的登录密码：
 *    {"alice@example.com":"pass-1234","bob@example.com":"pass-5678"}
 *    - 用户已存在：仅重置密码并清除其全部会话，**保留原有角色与封禁状态**；
 *    - 用户不存在：自动创建普通账户（role 为空，昵称取邮箱前缀）；
 *    - 需要管理员权限请配合后台「用户管理」调整角色。
 *
 * 工作方式：
 * - Worker 冷启动（每个实例一次）与每小时定时任务各检查一次；
 * - 以 HMAC-SHA256(BETTER_AUTH_SECRET, 上下文 + 密码) 作为标记存 KV（不可反推明文），
 *   标记一致则跳过，避免每次冷启动重复写库；
 * - 标记不一致时通过 PASSWORD_HASHER Durable Object 重新哈希（与 better-auth
 *   登录校验完全同构），重建 credential 凭据、清除该用户全部会话；
 * - 删除对应密钥即停用该机制，已同步过的密码保持不变。
 */

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { account, session, user } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server.env";

const ADMIN_MARKER_KEY = "runtime:admin-password-marker";
const USER_MARKER_KEY = "runtime:user-passwords-marker";

/** USER_PASSWORDS 最多处理的账户数，防止误粘贴超大 JSON 拖垮冷启动 */
const MAX_USER_PASSWORD_ENTRIES = 50;
const MAX_PASSWORD_LENGTH = 128;

/** PASSWORD_HASHER DO 实例池（与 auth.server.ts 保持一致的取法） */
const PASSWORD_HASHER_POOL_SIZE = 10;

function getPasswordHasher(env: Env) {
  const index = Math.floor(Math.random() * PASSWORD_HASHER_POOL_SIZE);
  const id = env.PASSWORD_HASHER.idFromName(`hasher-${index}`);
  return env.PASSWORD_HASHER.get(id);
}

/** HMAC-SHA256 标记：用于幂等判断的指纹，无法反推明文密码 */
async function hmacMarker(
  betterAuthSecret: string,
  payload: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(betterAuthSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 大小写不敏感地查找用户 id */
async function findUserIdByEmail(
  db: ReturnType<typeof getDb>,
  email: string,
): Promise<string | null> {
  const [found] = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`)
    .limit(1);
  return found?.id ?? null;
}

async function ensureUser(
  db: ReturnType<typeof getDb>,
  email: string,
  options: { forceAdmin: boolean },
): Promise<{ userId: string; created: boolean }> {
  const existingId = await findUserIdByEmail(db, email);
  if (existingId) {
    if (options.forceAdmin) {
      // 修正属性：保证超管可用（与 scripts/reset-admin-password.mjs 行为一致）
      await db
        .update(user)
        .set({
          role: "admin",
          emailVerified: true,
          banned: false,
          banReason: null,
          banExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existingId));
    }
    return { userId: existingId, created: false };
  }

  const [created] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: email.split("@")[0] || "User",
      email,
      emailVerified: true,
      role: options.forceAdmin ? "admin" : null,
      banned: false,
    })
    .returning({ id: user.id });
  return { userId: created.id, created: true };
}

/** 重建 credential 凭据并清除该用户全部会话（保留 GitHub 等其他登录方式） */
async function applyNewPassword(
  env: Env,
  db: ReturnType<typeof getDb>,
  userId: string,
  password: string,
): Promise<void> {
  const passwordHash = await getPasswordHasher(env).hash(password);
  await db
    .delete(account)
    .where(
      sql`${account.userId} = ${userId} AND ${account.providerId} = 'credential'`,
    );
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });
  await db.delete(session).where(eq(session.userId, userId));
}

function logSync(message: string, detail: Record<string, unknown>): void {
  console.log(JSON.stringify({ message, ...detail }));
}

/* ======================= 管理员密码同步 ======================= */

export type AdminPasswordSyncResult = {
  status: "skipped" | "updated" | "created";
  reason?: string;
};

export async function syncAdminPasswordFromEnv(
  env: Env,
): Promise<AdminPasswordSyncResult> {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, BETTER_AUTH_SECRET } = serverEnv(env);

  if (!ADMIN_PASSWORD) {
    return { status: "skipped", reason: "ADMIN_PASSWORD not set" };
  }

  const marker = await hmacMarker(
    BETTER_AUTH_SECRET,
    `admin-password:${ADMIN_PASSWORD}`,
  );
  const storedMarker = await env.KV.get(ADMIN_MARKER_KEY).catch(() => null);
  if (storedMarker === marker) {
    return { status: "skipped", reason: "marker matches" };
  }

  const db = getDb(env);
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const { userId, created } = await ensureUser(db, email, {
    forceAdmin: true,
  });
  await applyNewPassword(env, db, userId, ADMIN_PASSWORD);
  await env.KV.put(ADMIN_MARKER_KEY, marker);

  const status = created ? "created" : "updated";
  logSync("admin password synced from ADMIN_PASSWORD env", { status, email });
  return { status };
}

/* ======================= 批量用户密码同步 ======================= */

export type UserPasswordsSyncResult = {
  status: "skipped" | "synced";
  changed: string[];
  invalid: string[];
  reason?: string;
};

export async function syncUserPasswordsFromEnv(
  env: Env,
): Promise<UserPasswordsSyncResult> {
  const { USER_PASSWORDS, BETTER_AUTH_SECRET } = serverEnv(env);

  if (!USER_PASSWORDS) {
    return { status: "skipped", changed: [], invalid: [], reason: "USER_PASSWORDS not set" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(USER_PASSWORDS);
  } catch {
    logSync("USER_PASSWORDS is not valid JSON, skipped", {});
    return { status: "skipped", changed: [], invalid: [], reason: "invalid JSON" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    logSync("USER_PASSWORDS must be a JSON object {email: password}, skipped", {});
    return { status: "skipped", changed: [], invalid: [], reason: "not an object" };
  }

  const db = getDb(env);
  const markerDoc = (await env.KV.get(USER_MARKER_KEY, "json").catch(
    () => null,
  )) as Record<string, string> | null;
  const nextMarkers: Record<string, string> = { ...(markerDoc ?? {}) };

  const changed: string[] = [];
  const invalid: string[] = [];
  let processed = 0;

  for (const [rawEmail, rawPassword] of Object.entries(parsed)) {
    if (processed >= MAX_USER_PASSWORD_ENTRIES) {
      logSync("USER_PASSWORDS entry limit reached, remaining entries skipped", {
        limit: MAX_USER_PASSWORD_ENTRIES,
      });
      break;
    }

    const email = String(rawEmail).trim().toLowerCase();
    const password = typeof rawPassword === "string" ? rawPassword : "";
    if (!email.includes("@") || !password || password.length > MAX_PASSWORD_LENGTH) {
      invalid.push(rawEmail);
      continue;
    }
    processed += 1;

    const marker = await hmacMarker(
      BETTER_AUTH_SECRET,
      `user-password:${email}:${password}`,
    );
    if (markerDoc?.[email] === marker) {
      continue;
    }

    const { userId, created } = await ensureUser(db, email, {
      forceAdmin: false,
    });
    await applyNewPassword(env, db, userId, password);
    nextMarkers[email] = marker;
    changed.push(created ? `created:${email}` : email);
  }

  if (changed.length > 0) {
    await env.KV.put(USER_MARKER_KEY, JSON.stringify(nextMarkers));
    logSync("user passwords synced from USER_PASSWORDS env", {
      changed,
      invalid,
    });
    return { status: "synced", changed, invalid };
  }

  return {
    status: "skipped",
    changed,
    invalid,
    reason: "all markers match",
  };
}
