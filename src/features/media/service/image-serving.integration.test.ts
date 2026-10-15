import { describe, expect, it, vi } from "vitest";
import { handleImageRequest } from "./media.service";

/**
 * 图片服务缓存策略回归测试。
 *
 * 背景：R2 对象 key 由「时间戳 + uuid」生成，写入后内容不变，
 * 因此原图链路（显式 ?original=true、图片处理内部回源）必须下发长缓存，
 * 否则「点击放大图片」这类请求每次都会回源 R2 并消耗一次 Worker 请求。
 * 但图片处理失败降级到原图时必须保持不缓存，避免把瞬时失败固化一年。
 */

const KEY = "images/blog/articles/1791961344156-18821a43-dc40-4b19-946f-ee5e93325af3.png";

function createEnv() {
  const get = vi.fn(async () => ({
    body: new Uint8Array([1, 2, 3, 4]),
    httpEtag: '"test-etag"',
    httpMetadata: { contentType: "image/png" },
    writeHttpMetadata(headers: Headers) {
      headers.set("Content-Type", "image/png");
    },
  }));

  return { env: { R2: { get } } as unknown as Env, get };
}

describe("handleImageRequest cache policy", () => {
  it("serves the original with immutable cache headers when ?original=true", async () => {
    const { env, get } = createEnv();
    const request = new Request(
      `https://example.com/images/${KEY}?original=true`,
    );

    const response = await handleImageRequest(env, KEY, request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(response.headers.get("CDN-Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(get).toHaveBeenCalledWith(KEY);
  });

  it("serves the original with immutable cache headers for internal image-resizing回源", async () => {
    const { env } = createEnv();
    const request = new Request(`https://example.com/images/${KEY}`, {
      headers: { via: "1.1 image-resizing" },
    });

    const response = await handleImageRequest(env, KEY, request);

    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("returns 404 without cache headers when the object is missing", async () => {
    const env = {
      R2: { get: vi.fn(async () => null) },
    } as unknown as Env;

    const response = await handleImageRequest(
      env,
      KEY,
      new Request(`https://example.com/images/${KEY}?original=true`),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("does not long-cache the original when image transform fails", async () => {
    const { env } = createEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("transform unavailable"))),
    );

    try {
      const response = await handleImageRequest(
        env,
        KEY,
        new Request(`https://example.com/images/${KEY}`, {
          headers: { accept: "image/avif,image/webp,*/*" },
        }),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
