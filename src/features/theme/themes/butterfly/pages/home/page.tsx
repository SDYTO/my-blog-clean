import { useMemo } from "react";
import { useViewCounts } from "@/features/pageview/queries";
import type { HomePageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { Pagination } from "../../components/pagination";
import { PostCard } from "../../components/post-card";

/**
 * Butterfly 首页：文章列表（卡片纵向排列，间隔 18px）+ 分页
 */
export function HomePage({
  posts,
  page,
  pageSize,
  total,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: HomePageProps) {
  const delayOffset = 50;

  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);
  const { data: viewCounts, isPending: isPendingViewCounts } =
    useViewCounts(allSlugs);

  if (posts.length === 0) {
    return (
      <div className="butterfly-card-base flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 text-5xl opacity-30">🦋</div>
        <p className="text-sm butterfly-text-50">{m.home_no_posts()}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-[18px]">
        {posts.map((post, i) => (
          <div
            key={post.slug}
            className="butterfly-onload-animation"
            style={{
              animationDelay: `calc(var(--butterfly-content-delay) + ${i * delayOffset}ms)`,
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

      <div className="mt-5">
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
