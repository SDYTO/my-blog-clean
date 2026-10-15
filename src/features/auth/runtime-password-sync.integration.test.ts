import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  syncAdminPasswordFromEnv,
  syncUserPasswordsFromEnv,
} from "@/features/auth/runtime-password-sync.server";
import { getDb } from "@/lib/db";
import { account, session, user } from "@/lib/db/schema";

const testEnv = env as Env;
const db = getDb(testEnv);
const ADMIN_EMAIL = "admin@example.com"; // 与 vitest miniflare 绑定保持一致
const ADMIN_MARKER_KEY = "runtime:admin-password-marker";
const USER_MARKER_KEY = "runtime:user-passwords-marker";

async function verifyPassword(hash: string, password: string) {
  const id = testEnv.PASSWORD_HASHER.idFromName("verify-test");
  const stub = testEnv.PASSWORD_HASHER.get(id);
  return stub.verify({ hash, password });
}

async function getCredentialAccount(userId: string) {
  const [acc] = await db
    .select()
    .from(account)
    .where(eq(account.userId, userId));
  return acc;
}

async function findUserByEmail(email: string) {
  const [found] = await db.select().from(user).where(eq(user.email, email));
  return found;
}

describe("runtime password sync", () => {
  beforeEach(async () => {
    await db.delete(session);
    await db.delete(account);
    await db.delete(user);
    await testEnv.KV.delete(ADMIN_MARKER_KEY);
    await testEnv.KV.delete(USER_MARKER_KEY);
  });

  describe("ADMIN_PASSWORD (admin account)", () => {
    it("creates the admin account when it does not exist", async () => {
      const result = await syncAdminPasswordFromEnv({
        ...testEnv,
        ADMIN_PASSWORD: "super-secret-123",
      });

      expect(result.status).toBe("created");

      const created = await findUserByEmail(ADMIN_EMAIL);
      expect(created?.role).toBe("admin");
      expect(created?.emailVerified).toBe(true);

      const acc = await getCredentialAccount(created!.id);
      expect(acc?.providerId).toBe("credential");
      expect(await verifyPassword(acc?.password ?? "", "super-secret-123")).toBe(
        true,
      );
      expect(await verifyPassword(acc?.password ?? "", "wrong-password")).toBe(
        false,
      );
    });

    it("updates the existing admin password, fixes role and clears sessions", async () => {
      const [seeded] = await db
        .insert(user)
        .values({
          id: "admin-user-1",
          name: "Admin",
          email: ADMIN_EMAIL,
          emailVerified: true,
          role: "user",
          banned: true,
        })
        .returning({ id: user.id });

      await db.insert(session).values({
        id: "session-1",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        token: "token-1",
        userId: seeded.id,
      });
      await db.insert(account).values([
        {
          id: "old-credential",
          accountId: seeded.id,
          providerId: "credential",
          userId: seeded.id,
          password: "old-hash",
        },
        {
          id: "github-link",
          accountId: "github-123",
          providerId: "github",
          userId: seeded.id,
        },
      ]);

      const result = await syncAdminPasswordFromEnv({
        ...testEnv,
        ADMIN_PASSWORD: "brand-new-pass",
      });

      expect(result.status).toBe("updated");

      const updated = await findUserByEmail(ADMIN_EMAIL);
      expect(updated?.role).toBe("admin");
      expect(updated?.banned).toBe(false);

      // 会话已清空，credential 已重建，GitHub 登录方式保留
      const sessions = await db.select().from(session);
      expect(sessions).toHaveLength(0);

      const accounts = await db
        .select()
        .from(account)
        .where(eq(account.userId, seeded.id));
      expect(accounts).toHaveLength(2);

      const credential = accounts.find((a) => a.providerId === "credential");
      expect(credential?.id).not.toBe("old-credential");
      expect(await verifyPassword(credential?.password ?? "", "brand-new-pass"))
        .toBe(true);
    });

    it("skips re-sync when the marker already matches", async () => {
      const first = await syncAdminPasswordFromEnv({
        ...testEnv,
        ADMIN_PASSWORD: "same-password",
      });
      expect(first.status).toBe("created");

      const [accBefore] = await db.select().from(account);

      const second = await syncAdminPasswordFromEnv({
        ...testEnv,
        ADMIN_PASSWORD: "same-password",
      });
      expect(second.status).toBe("skipped");

      // 未重写凭据：记录保持不变（同一条 credential 行）
      const [accAfter] = await db.select().from(account);
      expect(accAfter.id).toBe(accBefore.id);
    });

    it("re-syncs when the password changes", async () => {
      await syncAdminPasswordFromEnv({
        ...testEnv,
        ADMIN_PASSWORD: "password-v1",
      });
      const second = await syncAdminPasswordFromEnv({
        ...testEnv,
        ADMIN_PASSWORD: "password-v2",
      });
      expect(second.status).toBe("updated");

      const admin = await findUserByEmail(ADMIN_EMAIL);
      const acc = await getCredentialAccount(admin!.id);
      expect(
        await verifyPassword(acc?.password ?? "", "password-v2"),
      ).toBe(true);
      expect(
        await verifyPassword(acc?.password ?? "", "password-v1"),
      ).toBe(false);
    });

    it("skips entirely when ADMIN_PASSWORD is not set", async () => {
      const result = await syncAdminPasswordFromEnv(testEnv);
      expect(result.status).toBe("skipped");

      const users = await db.select().from(user);
      expect(users).toHaveLength(0);
    });
  });

  describe("USER_PASSWORDS (arbitrary users)", () => {
    const userPasswords = JSON.stringify({
      "alice@example.com": "alice-pass-123",
      "bob@example.com": "bob-pass-456",
    });

    it("creates missing users as normal accounts", async () => {
      const result = await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: userPasswords,
      });

      expect(result.status).toBe("synced");
      expect(result.changed).toHaveLength(2);

      const alice = await findUserByEmail("alice@example.com");
      expect(alice).toBeDefined();
      expect(alice?.role).toBeNull(); // 普通用户，不是管理员
      expect(alice?.emailVerified).toBe(true);
      expect(alice?.name).toBe("alice");

      const acc = await getCredentialAccount(alice!.id);
      expect(await verifyPassword(acc?.password ?? "", "alice-pass-123")).toBe(
        true,
      );
      expect(await verifyPassword(acc?.password ?? "", "bob-pass-456")).toBe(
        false,
      );
    });

    it("resets an existing user's password, clears sessions and preserves role/ban", async () => {
      const [seeded] = await db
        .insert(user)
        .values({
          id: "alice-user-1",
          name: "Alice",
          email: "alice@example.com",
          emailVerified: true,
          role: null,
          banned: true,
          banReason: "spam",
        })
        .returning({ id: user.id });

      await db.insert(session).values({
        id: "alice-session",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        token: "alice-token",
        userId: seeded.id,
      });
      await db.insert(account).values([
        {
          id: "alice-credential",
          accountId: seeded.id,
          providerId: "credential",
          userId: seeded.id,
          password: "old-hash",
        },
        {
          id: "alice-github",
          accountId: "github-alice",
          providerId: "github",
          userId: seeded.id,
        },
      ]);

      const result = await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: JSON.stringify({
          "ALICE@example.com": "new-alice-pass",
        }),
      });

      expect(result.status).toBe("synced");
      expect(result.changed).toContain("alice@example.com");

      const alice = await findUserByEmail("alice@example.com");
      expect(alice?.id).toBe("alice-user-1");
      // 已存在用户：角色与封禁状态保持原样，由管理员在后台决定
      expect(alice?.role).toBeNull();
      expect(alice?.banned).toBe(true);
      expect(alice?.banReason).toBe("spam");

      expect(await db.select().from(session)).toHaveLength(0);

      const accounts = await db
        .select()
        .from(account)
        .where(eq(account.userId, seeded.id));
      expect(accounts).toHaveLength(2);
      const credential = accounts.find((a) => a.providerId === "credential");
      expect(
        await verifyPassword(credential?.password ?? "", "new-alice-pass"),
      ).toBe(true);
    });

    it("only re-syncs users whose password changed", async () => {
      await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: userPasswords,
      });

      const aliceBefore = await findUserByEmail("alice@example.com");
      const accBefore = await getCredentialAccount(aliceBefore!.id);

      // 只改 bob 的密码：alice 的凭据行保持不变
      const second = await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: JSON.stringify({
          "alice@example.com": "alice-pass-123",
          "bob@example.com": "bob-new-pass",
        }),
      });

      expect(second.status).toBe("synced");
      expect(second.changed).toEqual(["bob@example.com"]);

      const accAfter = await getCredentialAccount(aliceBefore!.id);
      expect(accAfter.id).toBe(accBefore.id);

      const bob = await findUserByEmail("bob@example.com");
      const bobAcc = await getCredentialAccount(bob!.id);
      expect(await verifyPassword(bobAcc?.password ?? "", "bob-new-pass")).toBe(
        true,
      );
    });

    it("rejects invalid entries without touching valid ones", async () => {
      const result = await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: JSON.stringify({
          "not-an-email": "whatever",
          "carol@example.com": "",
          "dave@example.com": "dave-pass-789",
        }),
      });

      expect(result.status).toBe("synced");
      expect(result.invalid).toEqual(["not-an-email", "carol@example.com"]);
      expect(
        await findUserByEmail("dave@example.com"),
      ).toBeDefined();
      expect(await findUserByEmail("carol@example.com")).toBeUndefined();
    });

    it("skips invalid JSON and non-object payloads", async () => {
      const badJson = await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: "{not json",
      });
      expect(badJson.status).toBe("skipped");

      const notObject = await syncUserPasswordsFromEnv({
        ...testEnv,
        USER_PASSWORDS: '["alice@example.com"]',
      });
      expect(notObject.status).toBe("skipped");

      expect(await db.select().from(user)).toHaveLength(0);
    });

    it("skips entirely when USER_PASSWORDS is not set", async () => {
      const result = await syncUserPasswordsFromEnv(testEnv);
      expect(result.status).toBe("skipped");
      expect(await db.select().from(user)).toHaveLength(0);
    });
  });
});
