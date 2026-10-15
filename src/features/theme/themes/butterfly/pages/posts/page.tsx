import { useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewCounts } from "@/features/pageview/queries";
import type { PostsPageProps } from "@/features/theme/contract/pages";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { PostCard } from "../../components/post-card";

/**
 * Butterfly 文章列表页：标签筛选 + 卡片列表 + 无限滚动
 */
export function PostsPage({
  posts,
  tags,
  selectedTag,
  onTagClick,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: PostsPageProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);
  const { data: viewCounts, isPending: isPendingViewCounts } =
    useViewCounts(allSlugs);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "0px" },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="butterfly-onload-animation flex flex-col gap-[18px]">
      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="butterfly-card-base flex flex-wrap items-center gap-2 px-5 py-4">
          <button
            type="button"
            onClick={() => onTagClick(undefined)}
            className={cn(
              "rounded-[8px] px-3 py-1 text-sm font-medium transition-colors",
              !selectedTag
                ? "bg-(--butterfly-primary) text-white"
                : "butterfly-btn-regular",
            )}
          >
            {m.posts_filter_all()}
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagClick(tag.name)}
              className={cn(
                "rounded-[8px] px-3 py-1 text-sm font-medium transition-colors",
                selectedTag === tag.name
                  ? "bg-(--butterfly-primary) text-white"
                  : "butterfly-btn-regular",
              )}
            >
              {tag.name}
              <span className="ml-1 text-xs opacity-60">{tag.postCount}</span>
            </button>
          ))}
        </div>
      )}

      {/* 文章卡片列表 */}
      <div className="flex flex-col gap-[18px]">
        {posts.map((post, i) => (
          <div
            key={post.slug}
            className="butterfly-onload-animation"
            style={{
              animationDelay: `calc(var(--butterfly-content-delay) + ${Math.min(i, 6) * 40}ms)`,
            }}
          >
            <PostCard
              post={post}
              pinned={post.pinnedAt != null}
              views={viewCounts?.[post.slug]}
              isLoadingViews={isPendingViewCounts}
            />
          </div>
        ))}
      </div>

      {/* 无限滚动触发点 */}
      <div
        ref={observerRef}
        className="flex flex-col items-center justify-center pb-4 pt-1"
      >
        {isFetchingNextPage ? (
          <div className="flex w-full flex-col gap-[18px]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="butterfly-card-base w-full animate-pulse space-y-3 p-7"
              >
                <Skeleton className="h-6 w-2/3 bg-black/10 dark:bg-white/10" />
                <Skeleton className="h-4 w-1/3 bg-black/10 dark:bg-white/10" />
                <Skeleton className="h-4 w-full bg-black/10 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : hasNextPage ? (
          <div className="h-px w-24 bg-black/10 dark:bg-white/10" />
        ) : posts.length > 0 ? (
          <div className="mt-2 flex items-center gap-4 text-black/20 dark:text-white/20">
            <span className="h-px w-12 bg-current" />
            <span className="text-sm font-bold italic">{m.posts_end()}</span>
            <span className="h-px w-12 bg-current" />
          </div>
        ) : (
          <div className="butterfly-card-base w-full px-8 py-12 text-center text-sm butterfly-text-50">
            {m.posts_no_posts()}
          </div>
        )}
      </div>
    </div>
  );
}
