import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { LatestPosts, LatestPostsSkeleton } from "./latest-posts";
import { Profile } from "./profile";
import { Tags, TagsSkeleton } from "./tags";

/**
 * Butterfly 侧边栏：作者卡 + 最新文章 + 标签云
 * 卡片间距 15px（对应源主题 .aside .card:not(:first-child)）
 */
export function Sidebar({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-[15px]", className)}>
      <div className="butterfly-onload-animation" style={{ animationDelay: "100ms" }}>
        <Profile />
      </div>

      <div className="butterfly-onload-animation" style={{ animationDelay: "150ms" }}>
        <Suspense fallback={<LatestPostsSkeleton />}>
          <LatestPosts />
        </Suspense>
      </div>

      <div className="butterfly-onload-animation" style={{ animationDelay: "200ms" }}>
        <Suspense fallback={<TagsSkeleton />}>
          <Tags />
        </Suspense>
      </div>
    </div>
  );
}
