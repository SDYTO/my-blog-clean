// 重置管理员账户密码（不删除既有 user 行，避免影响其关联的文章 / 评论 / 会话）
//
// 用法（只生成 SQL，不直接连库）：
//   node scripts/reset-admin-password.mjs <email> <password> [otp] [otpTtlDays] > reset.sql
//   bunx wrangler d1 execute DB --remote --config wrangler.jsonc --file reset.sql
//
// 说明：
//   - 本地账户登录已不再强制邮箱验证码，otp 参数可省略（省略时不写入验证码记录）
//   - 也可用环境变量 ADMIN_PASSWORD 传密码，避免明文出现在 shell 历史里
//   - 执行后会清空该用户的所有会话，需要用新密码重新登录
import crypto from "node:crypto";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { sha256 } from "@noble/hashes/sha2.js";

const N = 16384;
const r = 16;
const p = 1;
const dkLen = 64;

const email = (process.argv[2] ?? "").trim().toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";
const otp = (process.argv[4] ?? "").trim();
const otpTtlDays = Number(process.argv[5] ?? "7");

if (!email || !password) {
  console.error(
    "usage: node scripts/reset-admin-password.mjs <email> <password> [otp] [ttlDays]",
  );
  console.error("   or: ADMIN_PASSWORD=xxx node scripts/reset-admin-password.mjs <email>");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const key = await scryptAsync(password.normalize("NFKC"), salt, {
  N,
  p,
  r,
  dkLen,
  maxmem: 128 * N * r * 2,
});
const passwordHash = `${salt}:${Buffer.from(key).toString("hex")}`;

const now = Date.now();
const userId = crypto.randomUUID();
const accountId = crypto.randomUUID();

const esc = (s) => s.replace(/'/g, "''");
const E = esc(email);
const selector = `(SELECT id FROM user WHERE email = '${E}')`;

const statements = [
  "PRAGMA foreign_keys = ON;",
  // 1) 不存在才创建（保留既有用户的 id，避免影响其文章/评论关联）
  `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, banned)
   SELECT '${userId}', 'Admin', '${E}', 1, ${now}, ${now}, 'admin', 0
   WHERE NOT EXISTS (SELECT 1 FROM user WHERE email = '${E}');`,
  // 2) 修正既有用户的属性
  `UPDATE user SET role = 'admin', email_verified = 1, banned = 0, updated_at = ${now} WHERE email = '${E}';`,
  // 3) 重置凭据密码（移除旧的 credential 记录后重建）
  `DELETE FROM account WHERE provider_id = 'credential' AND user_id = ${selector};`,
  `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
   SELECT '${accountId}', user.id, 'credential', user.id, '${esc(passwordHash)}', ${now}, ${now}
   FROM user WHERE user.email = '${E}';`,
  // 4) 密码已变更：清理该用户的旧会话
  `DELETE FROM session WHERE user_id = ${selector};`,
  // 5) 清掉可能残留的历史邮箱验证码
  `DELETE FROM verification WHERE identifier = 'email-otp:login:${E}';`,
  `DELETE FROM verification WHERE identifier = 'email-otp:register:${E}';`,
];

// 6) 仅当显式传入 otp 时才写入一次性登录验证码（兼容旧流程）
if (otp) {
  const otpHash = Buffer.from(sha256(new TextEncoder().encode(otp))).toString("hex");
  const expiresAt = now + otpTtlDays * 24 * 60 * 60 * 1000;
  statements.push(
    `INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
     VALUES ('${crypto.randomUUID()}', 'email-otp:login:${E}', '${otpHash}', ${expiresAt}, ${now}, ${now});`,
  );
}

console.log(statements.join("\n"));
