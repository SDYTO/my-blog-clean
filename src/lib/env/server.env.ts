import { z } from "zod";

const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const localeSchema = z.enum(["zh", "en"]);
const domainSchema = z
  .string()
  .regex(domainRegex, "Must be a valid domain (e.g., www.example.com)");

const serverEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  ADMIN_EMAIL: z.email(),
  // 运行时管理员密码（可选密钥）：设置后 Worker 启动/定时任务会自动将其同步为
  // ADMIN_EMAIL 账户的登录密码（详见 features/auth/runtime-password-sync.server.ts）
  ADMIN_PASSWORD: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  // 运行时批量用户密码（可选密钥）：JSON 对象 {"邮箱":"密码"}，
  // 用户不存在则自动创建普通账户，已存在则保留角色与封禁状态
  USER_PASSWORDS: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
  LOCALE: localeSchema.catch("zh"),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_PURGE_API_TOKEN: z.string().optional(),
  DOMAIN: domainSchema,
  CDN_DOMAIN: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .refine(
      (v) => v === undefined || domainRegex.test(v),
      "Must be a valid domain (e.g., cdn.example.com)",
    ),
  ENVIRONMENT: z.enum(["dev", "prod", "test"]).optional(),
  VITE_UMAMI_WEBSITE_ID: z.string().optional(),
  UMAMI_SRC: z.string().optional(),
  PAGEVIEW_SALT: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_ANALYTICS_API_TOKEN: z.string().optional(),
});

export function serverEnv(env: Env) {
  const result = serverEnvSchema.safeParse(env);

  if (!result.success) {
    console.error(
      JSON.stringify({
        message: "Invalid environment variables",
        error: z.treeifyError(result.error),
      }),
    );
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

export const isNotInProduction = (env: Env) =>
  serverEnv(env).ENVIRONMENT === "test" || serverEnv(env).ENVIRONMENT === "dev";
