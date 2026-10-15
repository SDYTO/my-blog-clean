import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { LatestPosts, LatestPostsSkeleton } from "./latest-posts";
import { Profile } from "./profile";
import { Tags, TagsSkeleton } from "./tags";

/**
 * vhAstro 侧边栏
 * 对应源主题 Aside.less：`sticky top: calc(66px + 1rem)`，卡片间距 1rem。
 * 顺序：作者卡 → 最新文章 → 标签云。
 */
export function Sidebar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "sticky top-[calc(var(--vhastro-header-height)+1rem)] flex flex-col gap-[1rem] max-[888px]:static",
        className,
      )}
    >
      <div className="vhastro-onload-animation" style={{ animationDelay: "100ms" }}>
        <Profile />
      </div>

      <div className="vhastro-onload-animation" style={{ animationDelay: "150ms" }}>
        <Suspense fallback={<LatestPostsSkeleton />}>
          <LatestPosts />
        </Suspense>
      </div>

      <div className="vhastro-onload-animation" style={{ animationDelay: "200ms" }}>
        <Suspense fallback={<TagsSkeleton />}>
          <Tags />
        </Suspense>
      </div>
    </div>
  );
}
