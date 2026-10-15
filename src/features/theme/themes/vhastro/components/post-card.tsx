import { ClientOnly, Link } from "@tanstack/react-router";
import { Clock, Eye, Pin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";

interface PostCardProps {
  post: PostItem;
  pinned?: boolean;
  popular?: boolean;
  views?: number;
  isLoadingViews?: boolean;
}

/**
 * vhAstro 文章卡片
 * 对应源主题 src/components/ArticleCard/ArticleCard.less：
 *   白底 + 1px 描边 + 1rem 圆角；顶部为「分类（渐变文字）+ 日期」，
 *   随后是标题、两行摘要、`#tag` 标签列表；置顶时左上角 -45° 模糊徽标。
 *
 * 说明：本项目文章表没有封面字段，故省略源主题卡片的 banner 图区，
 * 其余排版与交互动效保持一致。
 */
export function PostCard({
  post,
  pinned,
  popular,
  views,
  isLoadingViews,
}: PostCardProps) {
  const tags = post.tags ?? [];
  const category = tags[0]?.name;

  return (
    <article
      className="vhastro-essay-item group relative h-full w-full flex-col p-0"
      data-pinned={pinned ? "true" : undefined}
    >
      {pinned && (
        <span className="vhastro-pin-badge">{m.home_pinned_posts()}</span>
      )}

      <header className="flex w-full flex-col gap-[0.66rem] px-[1.166rem] pb-[0.5rem] pt-[1.1rem]">
        <h3 className="flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {category ? (
              <Link
                to="/posts"
                search={{ tagName: category }}
                className="vhastro-cat-gradient shrink-0 text-[0.875rem]"
              >
                {category}
              </Link>
            ) : (
              <span className="shrink-0 text-[0.875rem] font-bold vhastro-text-40">
                {m.post_no_tags()}
              </span>
            )}
            {popular && (
              <span className="rounded-[0.28rem] bg-(--vhastro-primary-16) px-1.5 py-0.5 text-[0.7rem] font-medium text-(--vhastro-primary)">
                {m.home_popular_posts()}
              </span>
            )}
          </span>
          <time
            dateTime={post.publishedAt?.toISOString()}
            className="shrink-0 text-[0.805rem] vhastro-text-50"
          >
            <ClientOnly fallback="-">{formatDate(post.publishedAt)}</ClientOnly>
          </time>
        </h3>

        <h1 className="w-full overflow-hidden">
          <Link
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="text-[1.06rem] font-semibold transition-colors vhastro-text-90 hover:text-(--vhastro-primary)"
          >
            {post.title}
          </Link>
        </h1>
      </header>

      {/* 摘要 */}
      <h2 className="w-full overflow-hidden px-[1.166rem] text-[0.805rem] font-normal leading-[1.28rem] tracking-[0.88px] vhastro-text-75">
        <span className="line-clamp-2">{post.summary ?? ""}</span>
      </h2>

      {/* 标签 + 阅读信息 */}
      <h4 className="mt-auto flex w-full items-center justify-between gap-2 overflow-hidden px-[1.166rem] pb-[1rem] pt-[0.66rem]">
        <span className="flex min-w-0 flex-wrap items-center gap-x-[0.88rem] gap-y-1 overflow-hidden">
          {tags.slice(0, 4).map((tag) => (
            <Link
              key={tag.id}
              to="/posts"
              search={{ tagName: tag.name }}
              className="text-[0.688rem] transition-colors vhastro-text-50 hover:text-(--vhastro-primary) before:content-['#']"
            >
              {tag.name}
            </Link>
          ))}
        </span>

        <span className="flex shrink-0 items-center gap-3 text-[0.75rem] vhastro-text-40">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {post.readTimeInMinutes}
          </span>
          {isLoadingViews ? (
            <Skeleton className="h-3 w-6 rounded bg-(--vhastro-font-6)" />
          ) : (
            views !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Eye size={13} />
                {views.toLocaleString()}
              </span>
            )
          )}
        </span>
      </h4>

    </article>
  );
}

/** 置顶图标（供列表头部复用） */
export function PinnedIcon({ className }: { className?: string }) {
  return <Pin size={14} className={className} />;
}
