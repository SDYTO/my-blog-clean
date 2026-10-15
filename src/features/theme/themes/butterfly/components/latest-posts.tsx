import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { publicPostsPageQuery } from "@/features/posts/queries";
import { m } from "@/paraglide/messages";

export function LatestPostsSkeleton() {
  return (
    <div className="butterfly-card-base px-[23px] py-[16px]">
      <Skeleton className="mb-3 h-5 w-24" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Butterfly 侧边栏最新文章卡
 */
export function LatestPosts() {
  const { data } = useSuspenseQuery(publicPostsPageQuery({ offset: 0, limit: 5 }));

  if (data.items.length === 0) return null;

  return (
    <div className="butterfly-card-base px-[23px] py-[16px]">
      <h2 className="mb-2 flex items-center gap-1 text-base font-semibold butterfly-text-90">
        <Sparkles size={17} strokeWidth={1.75} className="text-(--butterfly-primary)" />
        {m.home_latest_posts()}
      </h2>

      <ul className="flex flex-col">
        {data.items.map((post, index) => (
          <li key={post.slug}>
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              className="group flex items-baseline gap-2 py-1 text-sm butterfly-text-75 transition-colors hover:text-(--butterfly-primary)"
            >
              <span className="shrink-0 text-xs opacity-50">{index + 1}.</span>
              <span className="line-clamp-2 flex-1 transition-transform group-hover:translate-x-0.5">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-black/10 pt-3 text-xs butterfly-text-50 dark:border-white/10">
        <span className="inline-flex items-center gap-1">
          <FileText size={13} strokeWidth={1.75} />
          {m.sidebar_total_posts({ count: data.total })}
        </span>
        <Link to="/posts" className="transition-colors hover:text-(--butterfly-primary)">
          {m.nav_posts()} →
        </Link>
      </div>
    </div>
  );
}
