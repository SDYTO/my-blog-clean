import type { z } from "zod";
import type { Duration } from "@/lib/duration";
import { ms } from "@/lib/duration";
import { purgeSiteCDNCache } from "@/lib/invalidate";
import { guardedKvDelete, guardedKvPut } from "./kv-write-guard";
import { serializeKey } from "./cache.utils";
import type { CacheKey, CacheNamespace } from "./types";

/**
 * 缓存数据
 * @param options.ttl - 缓存时间 (秒) 默认 3600 秒 (1 小时)
 */
export async function get<T extends z.ZodTypeAny>(
  context: BaseContext & { executionCtx: ExecutionContext },
  key: CacheKey,
  schema: T,
  fetcher: () => Promise<z.infer<T>>,
  options: { ttl?: Duration } = {},
): Promise<z.infer<T>> {
  const { ttl = "1h" } = options;
  const { env } = context;
  const serializedKey = serializeKey(key);

  const kvData = await env.KV.get(serializedKey, "json").catch((err) =>
    console.error(
      JSON.stringify({
        message: "cache get failed",
        key: serializedKey,
        error: String(err),
      }),
    ),
  );

  if (kvData !== null && kvData !== undefined) {
    const result = schema.safeParse(kvData);
    if (result.success) {
      console.log(JSON.stringify({ message: "cache hit", key: serializedKey }));
      return result.data;
    }
  }

  const data = await fetcher();

  if (data === null || data === undefined) return data;

  context.executionCtx.waitUntil(
    set(context, key, JSON.stringify(data), { ttl }),
  );

  console.log(JSON.stringify({ message: "cache miss", key: serializedKey }));
  return data;
}

/**
 * 读取单个缓存 key (不带 fetcher 回源逻辑)
 */
export async function getRaw(
  context: BaseContext,
  key: CacheKey,
): Promise<string | null> {
  const serializedKey = serializeKey(key);
  const value = await context.env.KV.get(serializedKey).catch((err) => {
    console.error(
      JSON.stringify({
        message: "cache get raw failed",
        key: serializedKey,
        error: String(err),
      }),
    );
    return null;
  });
  return value;
}

/**
 * 设置缓存数据
 * @param options.ttl - 缓存时间 (秒)，不设置则永久
 */
export async function set(
  context: BaseContext,
  key: CacheKey,
  value: string,
  options?: { ttl?: Duration },
): Promise<void> {
  const serializedKey = serializeKey(key);
  const putOptions = options?.ttl
    ? { expirationTtl: Math.floor(ms(options.ttl) / 1000) }
    : undefined;

  const written = await guardedKvPut(
    context.env,
    serializedKey,
    value,
    putOptions,
  );

  if (written) {
    console.log(JSON.stringify({ message: "cache set", key: serializedKey }));
  } else {
    console.log(
      JSON.stringify({
        message: "cache set skipped (kv degraded/disabled)",
        key: serializedKey,
      }),
    );
  }
}

export async function deleteKey(
  context: BaseContext,
  ...keys: Array<CacheKey>
): Promise<void> {
  const serializedKeys = keys.map(serializeKey);

  await Promise.all(
    serializedKeys.map((key) => guardedKvDelete(context.env, key)),
  );
}

/**
 * generation 指针的 isolate 级内存缓存时长。
 *
 * 一次 SSR 往往会读取多个 namespace 的版本指针（config:system / posts:list /
 * tags:list / navigation:data ...），未缓存时每个都要打一次 KV 读。
 * 同一 isolate 内复用 env，因此以 env 为键做短 TTL 记忆化，可把
 * 「每请求 N 次 KV 读」收敛为「每 30s 至多 1 次」，显著降低 KV 读取量。
 *
 * 一致性：CDN 对 HTML 的缓存窗口本身是 60s，且发布/更新时会主动
 * bumpVersion（本函数会同步刷新记忆值），因此 30s 的传播延迟
 * 不会让访客看到更旧的内容。
 */
const VERSION_MEMO_TTL_MS = 30_000;

type VersionMemoEntry = { value: string; expiresAt: number };

/**
 * 以 env 实例为键，避免不同运行实例（尤其是测试上下文）之间互相干扰。
 * WeakMap 不阻止 env 被回收。
 */
const versionMemoStore = new WeakMap<object, Map<string, VersionMemoEntry>>();

function versionMemo(env: object): Map<string, VersionMemoEntry> {
  let memo = versionMemoStore.get(env);
  if (!memo) {
    memo = new Map();
    versionMemoStore.set(env, memo);
  }
  return memo;
}

/**
 * 获取缓存 generation token。
 * 规范：Namespace 建议使用 "entity:scope" 格式，如 "posts:list"。
 */
export async function getVersion(
  context: BaseContext,
  namespace: CacheNamespace,
): Promise<string> {
  const key = `ver:${namespace}`;
  const memo = versionMemo(context.env);
  const now = Date.now();

  const cached = memo.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  let generation: string | null;
  try {
    generation = await context.env.KV.get(key);
  } catch (err) {
    console.error(
      JSON.stringify({
        message: "cache get version failed",
        key,
        error: String(err),
      }),
    );
    throw err;
  }

  if (generation === null) {
    memo.set(key, { value: "v0", expiresAt: now + VERSION_MEMO_TTL_MS });
    return "v0";
  }
  if (generation.length === 0) {
    const error = new Error("cache generation is empty");
    console.error(
      JSON.stringify({
        message: "cache generation invalid",
        key,
        error: error.message,
      }),
    );
    throw error;
  }

  const version = `v${generation}`;
  memo.set(key, { value: version, expiresAt: now + VERSION_MEMO_TTL_MS });
  return version;
}

/**
 * 生成新的 cache generation，使旧 generation 的 key 全部不可达。
 */
export async function bumpVersion(
  context: BaseContext,
  namespace: CacheNamespace,
): Promise<void> {
  const key = `ver:${namespace}`;
  const generation = crypto.randomUUID();

  const written = await guardedKvPut(context.env, key, generation);

  if (!written) {
    console.log(
      JSON.stringify({
        message: "cache version bump skipped (kv degraded/disabled)",
        key,
      }),
    );
    return;
  }

  // 同 isolate 立即改用新 generation，避免发布后本节点继续命中旧数据
  versionMemo(context.env).set(key, {
    value: `v${generation}`,
    expiresAt: Date.now() + VERSION_MEMO_TTL_MS,
  });

  console.log(
    JSON.stringify({
      message: "cache version bumped",
      key,
      generation,
    }),
  );
}

/**
 * 读取 versioned cache；generation pointer 不可用时直接回源。
 */
export async function getVersioned<T extends z.ZodTypeAny>(
  context: BaseContext & { executionCtx: ExecutionContext },
  namespace: CacheNamespace,
  keyForVersion: (version: string) => CacheKey,
  schema: T,
  fetcher: () => Promise<z.infer<T>>,
  options: { ttl?: Duration } = {},
): Promise<z.infer<T>> {
  let version: string;
  try {
    version = await getVersion(context, namespace);
  } catch {
    return await fetcher();
  }

  return await get(context, keyForVersion(version), schema, fetcher, options);
}

export async function invalidateSiteCache(
  context: BaseContext & { executionCtx: ExecutionContext },
) {
  const purgeTask = purgeSiteCDNCache(context.env);
  // 全站维护操作：轮换所有公开数据缓存 generation（各 1 次 KV 写，
  // 仅管理员手动触发，频率极低），让各 colo 的 Cache API 副本全部不可达
  const kvTasks = [
    bumpVersion(context, "posts:list"),
    bumpVersion(context, "posts:detail"),
    bumpVersion(context, "tags:list"),
    bumpVersion(context, "moments:page"),
    bumpVersion(context, "friend-links:list"),
    bumpVersion(context, "navigation:data"),
    bumpVersion(context, "config:system"),
  ];

  await Promise.all([purgeTask, ...kvTasks]);
  return { success: true };
}
