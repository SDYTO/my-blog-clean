import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { publicPostsPageQuery } from "@/features/posts/queries";
import { m } from "@/paraglide/messages";

export function LatestPostsSkeleton() {
  return (
    <div className="vhastro-aside-item">
      <Skeleton className="h-5 w-24 self-start" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-[0.38rem]" />
      ))}
    </div>
  );
}

const RANK_BG = [
  "bg-(--vhastro-success)",
  "bg-(--vhastro-warning)",
  "bg-(--vhastro-import)",
];

/**
 * 侧栏最新文章
 * 对应源主题 Aside.less `.vh-aside-articles`：
 *   序号徽标（前三名分别用 success / warning / import 色）+ 标题（hover 主色下划线）
 */
export function LatestPosts() {
  const { data } = useSuspenseQuery(
    publicPostsPageQuery({ offset: 0, limit: 5 }),
  );

  if (data.items.length === 0) return null;

  return (
    <div className="vhastro-aside-item">
      <h3 className="vhastro-aside-title">{m.sidebar_latest_posts_vhastro()}</h3>

      <section className="flex w-full flex-col gap-[0.5rem]">
        {data.items.map((post, index) => (
          <Link
            key={post.id}
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="group flex w-full flex-col justify-between overflow-hidden"
          >
            <span className="flex w-full items-center gap-[0.618rem]">
              <i
                className={`flex h-[0.875rem] w-[0.875rem] shrink-0 items-center justify-center rounded-[0.18rem] text-[0.66rem] not-italic text-white ${
                  RANK_BG[index] ?? "bg-(--vhastro-default)"
                }`}
              >
                {index + 1}
              </i>
              <cite className="max-w-full truncate text-[0.8rem] not-italic leading-6 vhastro-text-90 transition-colors group-hover:text-(--vhastro-primary)">
                {post.title}
              </cite>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
