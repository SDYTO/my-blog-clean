import { ClientOnly, Link } from "@tanstack/react-router";
import { Calendar, Clock, Eye, Flame, Pin, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { cn } from "@/lib/utils";
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
 * Butterfly 文章列表卡片（对应源主题 .essay .item）
 * 圆角卡片 + 置顶徽标 + 主色标题 + `|` 分隔元信息 + 摘要。
 */
export function PostCard({
  post,
  pinned,
  popular,
  views,
  isLoadingViews,
}: PostCardProps) {
  const tagNames = (post.tags ?? []).map((t) => t.name);

  return (
    <article
      className={cn(
        "butterfly-card-base butterfly-card-hover group relative w-full overflow-hidden p-6 md:p-7",
        pinned && "ring-1 ring-(--butterfly-primary)/20",
      )}
    >
      {pinned && <span className="butterfly-pin-badge">置顶</span>}

      {(pinned || popular) && (
        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
          {pinned ? (
            <>
              <Pin size={16} className="fill-current text-(--butterfly-primary)" />
              <span className="text-(--butterfly-primary)">
                {m.home_pinned_posts()}
              </span>
            </>
          ) : (
            <>
              <Flame size={16} className="text-orange-500" />
              <span className="text-orange-500">{m.home_popular_posts()}</span>
            </>
          )}
        </div>
      )}

      <h2 className="mb-3">
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          className="line-clamp-2 text-[1.5rem] font-bold leading-[1.4] butterfly-text-90 transition-colors group-hover:text-(--butterfly-primary) max-md:text-[1.25rem]"
        >
          {post.title}
        </Link>
      </h2>

      {/* 元信息：日期 | 作者 | 标签 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm butterfly-text-50">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} strokeWidth={1.75} />
          <time dateTime={post.publishedAt?.toISOString()}>
            <ClientOnly fallback="-">{formatDate(post.publishedAt)}</ClientOnly>
          </time>
        </span>

        {post.author && (
          <span className="inline-flex items-center gap-1.5">
            <User size={14} strokeWidth={1.75} />
            {post.author}
          </span>
        )}

        {tagNames.length > 0 && (
          <span className="inline-flex flex-wrap items-center gap-x-1.5">
            {tagNames.map((name, i) => (
              <span key={name} className="inline-flex items-center gap-1.5">
                {i > 0 && <span className="opacity-40">•</span>}
                <Link
                  to="/posts"
                  search={{ tagName: name }}
                  className="transition-colors hover:text-(--butterfly-primary)"
                >
                  {name}
                </Link>
              </span>
            ))}
          </span>
        )}
      </div>

      {post.summary && (
        <p className="mb-3 line-clamp-2 leading-[1.8] butterfly-text-75">
          {post.summary}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm butterfly-text-50">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} strokeWidth={1.75} />
          {m.read_time({ count: post.readTimeInMinutes })}
        </span>
        {isLoadingViews ? (
          <span className="inline-flex items-center gap-1.5">
            <Eye size={15} />
            <Skeleton className="h-3.5 w-8 rounded bg-black/10 dark:bg-white/10" />
          </span>
        ) : (
          views !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <Eye size={15} strokeWidth={1.75} />
              {views.toLocaleString()}
            </span>
          )
        )}
      </div>
    </article>
  );
}
