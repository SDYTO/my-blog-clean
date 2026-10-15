import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  getChallengeServerConfig,
  isChallengeReady,
  isFullSiteChallengeEnabled,
  verifyAltchaSolutionPayload,
} from "@/features/challenge/service/challenge.service";
import * as ConfigService from "@/features/config/service/config.service";
import { getLinkAccessSettings } from "@/features/media/service/link-access.service";
import { getAuth } from "@/lib/auth/auth.server";
import { CACHE_CONTROL } from "@/lib/constants";
import { getDb } from "@/lib/db";
import type { Duration } from "@/lib/duration";
import { serverEnv } from "@/lib/env/server.env";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { applyNoCachePageHeaders } from "./challenge-rules";
import { isPathValid } from "./path-manifest.generated";

declare module "hono" {
  interface ContextVariableMap {
    db: ReturnType<typeof getDb>;
    auth: ReturnType<typeof getAuth>;
  }
}

export const baseMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const db = getDb(c.env);
    const auth = getAuth({ db, env: c.env });
    c.set("db", db);
    c.set("auth", auth);
    return next();
  },
);

/**
 * 安全响应头中间件。
 *
 * 统一为所有响应注入基础安全头，缓解点击劫持、MIME 嗅探、协议降级与
 * Referer 信息外泄等风险。挂在最外层（见 routes.ts），因此对页面、API、
 * 静态资源均生效。
 *
 * 说明：
 * - HSTS 仅在 HTTPS 请求上下文中返回（Cloudflare 边缘已终止 TLS，
 *   生产环境始终为 https，故生产必然下发；本地 http 调试不会误设）。
 * - 不设置 Content-Security-Policy：站点使用主题动态资源、内联样式与
 *   统计脚本，CSP 需按实际资源白名单单独调试，贸然启用会破坏页面。
 *   如需加固，建议先在 Cloudflare Transform Rules 中以 Report-Only 观察。
 * - 采用「不覆盖已有值」策略：若具体路由已自行设置同名头（如媒体路由
 *   的 Cache-Control 类头），保留路由级更精确的取值。
 */
export const securityHeadersMiddleware = createMiddleware(async (c, next) => {
  await next();

  const headers = c.res.headers;
  const setIfAbsent = (name: string, value: string) => {
    if (!headers.has(name)) headers.set(name, value);
  };

  // 兜底：任何 5xx 都不得被浏览器或 CDN 缓存。
  // 部分路由（如站点文档）会在构建响应时就写入较长的 Cache-Control，
  // 一旦处理过程中抛错返回 5xx，那些长缓存头会被继承，导致错误响应被
  // 边缘缓存并在故障恢复后继续对外返回。此处强制覆盖为不缓存。
  if (c.res.status >= 500) {
    headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  }

  setIfAbsent("X-Content-Type-Options", "nosniff");
  setIfAbsent("X-Frame-Options", "SAMEORIGIN");
  setIfAbsent("Referrer-Policy", "strict-origin-when-cross-origin");
  setIfAbsent(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  setIfAbsent("Cross-Origin-Opener-Policy", "same-origin");

  // HSTS 仅对 HTTPS 下发，避免本地 http 开发时浏览器把 localhost 强制跳转
  const isHttps =
    c.req.url.startsWith("https://") ||
    c.req.header("x-forwarded-proto") === "https";
  if (isHttps) {
    setIfAbsent(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // HSTS 前置声明（Cloudflare 支持），预加载列表提交需另行申请
  setIfAbsent("X-DNS-Prefetch-Control", "on");
});

const tryCacheResponse = (c: Context, cache: Cache) => {
  let strategy:
    | typeof CACHE_CONTROL.notFound
    | typeof CACHE_CONTROL.serverError
    | typeof CACHE_CONTROL.forbidden
    | null = null;
  if (c.res.status === 404) {
    strategy = CACHE_CONTROL.notFound;
  } else if (c.res.status >= 500) {
    strategy = CACHE_CONTROL.serverError;
  }
  if (strategy) {
    Object.entries(strategy).forEach(([k, v]) => {
      c.res.headers.set(k, v);
    });
  }

  // 5xx 一律不交给边缘缓存。
  // 站点文档路由（sitemap/rss/robots/manifest）会预先设置较长的
  // Cache-Control（如 s-maxage=3600，robots 达 86400），若冷启动或
  // 临时故障期间产生 5xx，该错误响应会连同这个长 s-maxage 一起被
  // Cloudflare 边缘缓存，导致故障恢复后仍持续对外返回错误。
  // 这里直接把 5xx 的缓存头收紧为不可缓存，从根源上避免该问题。
  if (c.res.status >= 500) {
    c.res.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    c.res.headers.set("CDN-Cache-Control", "no-store");
    c.res.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
    return;
  }

  const resCacheControl = c.res.headers.get("Cache-Control");
  const hasSetCookie = c.res.headers.has("Set-Cookie");

  const isStatusCacheable = c.res.status === 200 || c.res.status === 404;

  const isCacheable =
    isStatusCacheable &&
    !hasSetCookie &&
    resCacheControl &&
    !resCacheControl.includes("no-store") &&
    !resCacheControl.includes("no-cache") &&
    !resCacheControl.includes("private");

  if (!isCacheable) return;

  const responseToCache = c.res.clone();
  c.executionCtx.waitUntil(
    cache.put(c.req.raw, responseToCache).catch(() => {}),
  );
};

export const cacheMiddleware = createMiddleware(async (c, next) => {
  if (c.req.method !== "GET") {
    return next();
  }

  const path = c.req.path;

  // 排除需要 session 的 API（如 /api/auth, /api/send）
  // 但包含 public API（/api/posts, /api/post, /api/tags, /api/search）
  const EXCLUDED_PREFIXES = ["/api/auth", "/api/send", "/media/file"];
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return next();
  }

  // 全站人机验证开启时，受保护的前台页面不能进边缘缓存，
  // 否则缓存的页面会被未验证访客直接命中，绕过门卫。
  if (isFullSiteProtectedPagePath(path) && c.env) {
    try {
      const config = await getChallengeServerConfig({
        db: getDb(c.env),
        env: c.env,
        executionCtx: c.executionCtx,
      });
      if (isFullSiteChallengeEnabled(config)) {
        await next();
        // 除跳过 Worker 缓存外，还要强制不缓存页面响应（浏览器/CDN 均 no-store）：
        // 否则「锁定态」或「已解锁态」的 HTML 一旦被任一层缓存，
        // 会把验证通过的访客再次带到遮罩前（或反向绕过门卫）。
        applyNoCachePageHeaders(c.res.headers);
        return;
      }
    } catch {
      // 配置读取失败时保守处理：不缓存且禁止缓存
      await next();
      applyNoCachePageHeaders(c.res.headers);
      return;
    }
  }

  // 防盗链 protected 模式下，/images/* 响应依赖 Referer，不能进边缘缓存
  // （缓存键不含 Referer，否则白名单校验会被缓存绕过）
  if (path.startsWith("/images/") && c.env) {
    try {
      const config = await ConfigService.getSystemConfig({
        db: getDb(c.env),
        env: c.env,
        executionCtx: c.executionCtx,
      });
      if (getLinkAccessSettings(config).mode === "protected") {
        return next();
      }
    } catch {
      // 配置读取失败时保守处理：不缓存
      return next();
    }
  }

  // 缓存响应逻辑
  const cache = (caches as unknown as { default: Cache }).default;

  const cachedResponse = await cache.match(c.req.raw);
  if (cachedResponse) return cachedResponse;

  await next();

  tryCacheResponse(c, cache);
});

const SHIELD_ALLOWED_PATHS = new Set([
  "/atom.xml",
  "/feed.json",
  "/robots.txt",
  "/rss.xml",
  "/site.webmanifest",
  "/sitemap.xml",
]);

interface RateLimitOptions {
  capacity: number;
  interval: Duration;
  identifier: string | ((c: Context) => string | undefined);
}

export const rateLimitMiddleware = (options: RateLimitOptions) =>
  createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const identifier =
      typeof options.identifier === "function"
        ? options.identifier(c)
        : options.identifier;
    const id = c.env.RATE_LIMITER.idFromName(identifier ?? "unknown");
    const rateLimiter = c.env.RATE_LIMITER.get(id);

    const result = await rateLimiter.checkLimit({
      capacity: options.capacity,
      interval: options.interval,
    });

    if (!result.allowed) {
      // RFC 7231：Retry-After 单位为秒
      c.res.headers.set(
        "Retry-After",
        Math.ceil(result.retryAfterMs / 1000).toString(),
      );
      return c.json(
        {
          code: "RATE_LIMITED",
          message: "Too Many Requests",
          retryAfterMs: result.retryAfterMs,
        },
        429,
      );
    }

    return next();
  });

export const shieldMiddleware = createMiddleware(async (c, next) => {
  if (serverEnv(c.env).ENVIRONMENT === "dev") return next();

  const path = c.req.path;

  if (
    // 静态资源
    path.startsWith("/assets/") ||
    path.startsWith("/favicon") ||
    SHIELD_ALLOWED_PATHS.has(path) ||
    path.startsWith("/apple-touch-icon") ||
    path.startsWith("/web-app-manifest") ||
    // Server Function
    path.startsWith("/_serverFn/")
  ) {
    return next();
  }

  if (isPathValid(path)) {
    return next();
  }
  const response = c.text("Not Found", 404);
  // 只缓存 Shield 拦截的 404，保护正常 404
  Object.entries(CACHE_CONTROL.notFound).forEach(([k, v]) => {
    response.headers.set(k, v);
  });
  return response;
});

/* ======================= Challenge (Turnstile / ALTCHA PoW) ====================== */
/**
 * 人机验证中间件：
 * - provider = "none" 或未就绪：跳过。
 * - provider = "turnstile"：Turnstile token 通过即短路；失败/缺失时接受 ALTCHA PoW 兜底。
 * - provider = "altcha"：只校验 X-Altcha-Solution。
 */
export const challengeMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    // 邮箱 OTP 校验（登录/注册的最终提交）凭证即邮箱控制权证明：
    // 验证码由系统下发至本人邮箱、一次性、2 分钟有效，且 /api/auth/otp/send
    // 同样不挂人机验证并受 IP + 每邮箱限流兜底，故携带 X-Otp 时跳过挑战。
    if (c.req.header("X-Otp")) return next();

    const config = await getChallengeServerConfig({
      db: c.get("db"),
      env: c.env,
      executionCtx: c.executionCtx,
    });
    if (!isChallengeReady(config)) return next();

    const turnstileToken = c.req.header("X-Turnstile-Token");
    const altchaSolution = c.req.header("X-Altcha-Solution");

    if (config.provider === "turnstile") {
      if (turnstileToken) {
        const result = await verifyTurnstileToken({
          secretKey: config.turnstile.secretKey,
          token: turnstileToken,
        });
        if (result.success) return next(); // Turnstile 短路，跳过 PoW
      }

      if (altchaSolution) {
        const verification = await verifyAltchaSolutionPayload(
          c.env,
          altchaSolution,
        );
        if (verification.ok) return next();
        return c.json(
          {
            code: "CHALLENGE_VERIFICATION_FAILED",
            message: "Challenge verification failed",
          },
          403,
        );
      }

      return c.json(
        {
          code: "TURNSTILE_MISSING_TOKEN",
          message: "Missing Turnstile token",
        },
        400,
      );
    }

    if (altchaSolution) {
      const verification = await verifyAltchaSolutionPayload(
        c.env,
        altchaSolution,
      );
      if (verification.ok) return next();
      return c.json(
        {
          code: "CHALLENGE_VERIFICATION_FAILED",
          message: "Challenge verification failed",
        },
        403,
      );
    }

    return c.json(
      {
        code: "CHALLENGE_MISSING_TOKEN",
        message: "Missing challenge token",
      },
      400,
    );
  },
);

/* ======================= Full-site Challenge Gate ====================== */
/**
 * 前台「保护全站」前台页面前缀（不含登录/注册、后台、API、静态资源）。
 * 命中这些路径的 GET 请求需要携带有效的全站通行证 cookie。
 */
const FULLSITE_PUBLIC_PAGE_PREFIXES = [
  "/posts",
  "/post/",
  "/search",
  "/moments",
  "/friend-links",
  "/about",
  "/navigation",
] as const;

/** 需要被豁免（可自由访问）的路径前缀。 */
const FULLSITE_SKIP_PREFIXES = [
  "/api/",
  "/admin",
  "/_serverFn/",
  "/oauth/",
  "/unsubscribe",
  "/assets/",
  "/media/",
  "/images/",
  "/favicon",
  "/apple-touch-icon",
  "/web-app-manifest",
  "/stats.js",
  "/robots.txt",
  "/atom.xml",
  "/feed.json",
  "/rss.xml",
  "/sitemap.xml",
  "/site.webmanifest",
];

/** 该路径是否为需要全站验证保护的前台页面。 */
export function isFullSiteProtectedPagePath(path: string): boolean {
  if (FULLSITE_SKIP_PREFIXES.some((p) => path.startsWith(p))) return false;
  if (path === "/") return true;
  return FULLSITE_PUBLIC_PAGE_PREFIXES.some((p) => path.startsWith(p));
}

/** 从 Cookie 头解析指定 cookie 名对应的值。 */
export function parseCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=") || undefined;
    }
  }
  return undefined;
}
