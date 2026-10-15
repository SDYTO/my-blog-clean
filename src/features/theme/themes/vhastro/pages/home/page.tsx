import { useMemo } from "react";
import { useViewCounts } from "@/features/pageview/queries";
import type { HomePageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { Pagination } from "../../components/pagination";
import { PostCard } from "../../components/post-card";

/**
 * vhAstro 首页
 * 对应源主题 ArticleCard.less `.article-list`：
 *   三列网格（≤1150px 两列，≤556px 单列），列间距 1.288rem；
 *   分页位于列表底部居中。
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
  const allSlugs = useMemo(() => posts.map((p) => p.slug), [posts]);
  const { data: viewCounts, isPending: isPendingViewCounts } =
    useViewCounts(allSlugs);

  if (posts.length === 0) {
    return (
      <div className="vhastro-aside-item items-center px-6 py-16 text-center">
        <div className="mb-4 text-5xl opacity-30">🪶</div>
        <p className="text-sm vhastro-text-50">{m.home_no_posts()}</p>
      </div>
    );
  }

  return (
    <div className="vhastro-onload-animation flex w-full flex-col pb-[2rem]">
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

      <div className="mt-[1.5rem]">
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
