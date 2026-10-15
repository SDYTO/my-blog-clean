import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { McpApiHandler } from "@/features/mcp/api/mcp-api-handler";
import { createWorkersOAuthProviderOptions } from "@/features/oauth-provider/oauth-provider.config";
import { appWorkerHandler } from "./app-handler";

let oauthProvider: OAuthProvider<Env> | null = null;

function getOAuthProvider() {
  if (oauthProvider) {
    return oauthProvider;
  }

  oauthProvider = new OAuthProvider(
    createWorkersOAuthProviderOptions({
      apiHandlers: {
        "/mcp": McpApiHandler,
      },
      defaultHandler: appWorkerHandler,
    }),
  );

  return oauthProvider;
}

/**
 * 运行时密码同步（ADMIN_PASSWORD / USER_PASSWORDS 密钥）：
 * 每个 Worker 实例生命周期内只检查一次（内部有 KV 标记做幂等），
 * 失败只记日志，绝不阻塞正常请求。
 */
let runtimePasswordSyncStarted = false;

function scheduleRuntimePasswordSync(env: Env, ctx: ExecutionContext) {
  if (runtimePasswordSyncStarted) {
    return;
  }
  runtimePasswordSyncStarted = true;

  ctx.waitUntil(
    (async () => {
      const { syncAdminPasswordFromEnv, syncUserPasswordsFromEnv } = await import(
        "@/features/auth/runtime-password-sync.server"
      );
      const [admin, users] = await Promise.allSettled([
        syncAdminPasswordFromEnv(env),
        syncUserPasswordsFromEnv(env),
      ]);
      if (admin.status === "fulfilled" && admin.value.status !== "skipped") {
        console.log(
          JSON.stringify({
            message: "ADMIN_PASSWORD sync finished on cold start",
            ...admin.value,
          }),
        );
      }
      if (users.status === "fulfilled" && users.value.status !== "skipped") {
        console.log(
          JSON.stringify({
            message: "USER_PASSWORDS sync finished on cold start",
            ...users.value,
          }),
        );
      }
    })().catch((error: unknown) => {
      console.error(
        JSON.stringify({
          message: "runtime password sync failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }),
  );
}

export function handleRootRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
) {
  scheduleRuntimePasswordSync(env, ctx);
  return getOAuthProvider().fetch(request, env, ctx);
}
