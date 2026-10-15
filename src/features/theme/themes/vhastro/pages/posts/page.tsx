import { useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewCounts } from "@/features/pageview/queries";
import type { PostsPageProps } from "@/features/theme/contract/pages";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { PostCard } from "../../components/post-card";

/**
 * vhAstro 文章列表页
 * 对应源主题：标签筛选条 + 三列文章卡片网格 + 无限滚动
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
    <div className="vhastro-onload-animation flex w-full flex-col gap-[1rem]">
      {/* 标签筛选（源主题 .vh-aside-cat 的胶囊风格） */}
      {tags.length > 0 && (
        <div className="vhastro-aside-item flex-row flex-wrap items-center gap-[0.5rem] p-[0.88rem]">
          <button
            type="button"
            onClick={() => onTagClick(undefined)}
            className={cn(
              "rounded-[0.38rem] px-[0.75rem] py-[0.3rem] text-sm font-medium transition-colors",
              !selectedTag
                ? "bg-(--vhastro-primary) text-white"
                : "bg-(--vhastro-font-6) vhastro-text-75 hover:bg-(--vhastro-primary-16) hover:text-(--vhastro-primary)",
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
                "rounded-[0.38rem] px-[0.75rem] py-[0.3rem] text-sm font-medium transition-colors",
                selectedTag === tag.name
                  ? "bg-(--vhastro-primary) text-white"
                  : "bg-(--vhastro-font-6) vhastro-text-75 hover:bg-(--vhastro-primary-16) hover:text-(--vhastro-primary)",
              )}
            >
              {tag.name}
              <span className="ml-1 text-xs opacity-60">{tag.postCount}</span>
            </button>
          ))}
        </div>
      )}

      {/* 文章卡片网格 */}
      <section className="grid w-full grid-cols-3 gap-[1.288rem] max-[1150px]:grid-cols-2 max-[556px]:grid-cols-1">
        {posts.map((post, i) => (
          <div
            key={post.slug}
            className="vhastro-onload-animation flex h-full"
            style={{
              animationDelay: `calc(var(--vhastro-content-delay) + ${Math.min(i, 8) * 40}ms)`,
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
      </section>

      {/* 无限滚动触发点 */}
      <div
        ref={observerRef}
        className="flex flex-col items-center justify-center pb-4 pt-1"
      >
        {isFetchingNextPage ? (
          <div className="grid w-full grid-cols-3 gap-[1.288rem] max-[1150px]:grid-cols-2 max-[556px]:grid-cols-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="vhastro-aside-item animate-pulse items-stretch gap-3"
              >
                <Skeleton className="h-4 w-1/3 bg-(--vhastro-font-6)" />
                <Skeleton className="h-5 w-2/3 bg-(--vhastro-font-6)" />
                <Skeleton className="h-4 w-full bg-(--vhastro-font-6)" />
              </div>
            ))}
          </div>
        ) : hasNextPage ? (
          <div className="h-px w-24 bg-(--vhastro-font-16)" />
        ) : posts.length > 0 ? (
          <div className="mt-2 flex items-center gap-4 vhastro-text-30">
            <span className="h-px w-12 bg-current" />
            <span className="text-sm font-bold italic">{m.posts_end()}</span>
            <span className="h-px w-12 bg-current" />
          </div>
        ) : (
          <div className="vhastro-aside-item w-full px-8 py-12 text-center text-sm vhastro-text-50">
            {m.posts_no_posts()}
          </div>
        )}
      </div>
    </div>
  );
}
