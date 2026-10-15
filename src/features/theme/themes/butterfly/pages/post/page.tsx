import { Link } from "@tanstack/react-router";
import { Clock, FileText, Pencil } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PostGateShell } from "@/features/posts/components/post-gate-shell";
import type { PostPageProps } from "@/features/theme/contract/pages";
import { ButterflyCommentSection } from "@/features/theme/themes/butterfly/components/comments/view/comment-section";
import { ContentRenderer } from "@/features/theme/themes/butterfly/components/content/content-renderer";
import { authClient } from "@/lib/auth/auth.client";
import { m } from "@/paraglide/messages";
import { PostMeta } from "./components/post-meta";
import {
  PostNavigation,
  PostNavigationSkeleton,
} from "./components/post-navigation";
import { PostSummary } from "./components/post-summary";
import { RelatedPosts, RelatedPostsSkeleton } from "./components/related-posts";
import TableOfContents from "./components/table-of-contents";
import { TocDrawer } from "./components/toc-drawer";

/**
 * Butterfly 文章详情页
 * 桌面端目录注入右侧 aside（对应源主题 views/aside::post），
 * 小屏使用浮动按钮 + 抽屉。
 */
export function PostPage({ post, hideAdminEdit }: PostPageProps) {
  const { data: session } = authClient.useSession();
  const wordCount = post.readTimeInMinutes * 300;

  const [asideSlot, setAsideSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setAsideSlot(document.getElementById("butterfly-aside-slot"));
  }, []);

  return (
    <div className="relative flex w-full flex-col gap-[18px]">
      {/* 桌面端侧栏目录 */}
      {asideSlot &&
        createPortal(
          <TableOfContents headers={post.toc ?? []} card />,
          asideSlot,
        )}

      {/* 小屏浮动目录抽屉 */}
      <TocDrawer headers={post.toc ?? []} />

      <article className="butterfly-card-base butterfly-onload-animation relative z-10 w-full px-6 pb-5 pt-6 md:px-9">
        {/* 字数 / 阅读时长 / 编辑入口 */}
        <div className="mb-3 flex flex-row flex-wrap items-center gap-5 butterfly-text-30">
          <div className="flex flex-row items-center">
            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 butterfly-text-50 dark:bg-white/10">
              <FileText strokeWidth={1.5} size={16} />
            </div>
            <div className="text-sm">{m.post_word_count({ count: wordCount })}</div>
          </div>
          <div className="flex flex-row items-center">
            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 butterfly-text-50 dark:bg-white/10">
              <Clock strokeWidth={1.5} size={16} />
            </div>
            <div className="text-sm">
              {m.read_time({ count: post.readTimeInMinutes })}
            </div>
          </div>
          {session?.user.role === "admin" && !hideAdminEdit && (
            <Link
              to="/admin/posts/edit/$id"
              params={{ id: String(post.id) }}
              className="flex flex-row items-center butterfly-text-30 transition hover:butterfly-text-90"
            >
              <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 butterfly-text-50 dark:bg-white/10">
                <Pencil strokeWidth={1.5} size={16} />
              </div>
              <div className="text-sm">{m.post_edit()}</div>
            </Link>
          )}
        </div>

        {/* 标题 */}
        <h1
          className="relative mb-3 block w-full text-3xl font-bold butterfly-text-90 md:text-[2.25rem]/[2.75rem] md:before:absolute md:before:-left-4.5 md:before:top-3 md:before:h-5 md:before:w-1 md:before:rounded-md md:before:bg-(--butterfly-primary)"
          style={{ viewTransitionName: `post-title-${post.slug}` }}
        >
          {post.title}
        </h1>

        {/* 元信息 */}
        <PostMeta post={post} className="mb-5" />

        {/* 摘要 */}
        <PostSummary summary={post.summary} />

        {/* 正文 */}
        <div className="mb-6 prose max-w-none! butterfly-custom-md dark:prose-invert prose-base">
          <ContentRenderer content={post.contentJson} />
        </div>

        {/* 正文结束提示 */}
        <div className="my-8 flex w-full items-center justify-center">
          <div className="h-px w-full bg-linear-to-r from-transparent via-(--butterfly-meta-divider) to-transparent opacity-20" />
          <span className="mx-4 whitespace-nowrap font-mono text-sm tracking-widest text-(--butterfly-meta-divider) opacity-50">
            END
          </span>
          <div className="h-px w-full bg-linear-to-r from-(--butterfly-meta-divider) via-transparent to-transparent opacity-20" />
        </div>
      </article>

      {/* 上一篇 / 下一篇 */}
      <Suspense fallback={<PostNavigationSkeleton />}>
        <PostNavigation slug={post.slug} />
      </Suspense>

      {/* 相关文章 */}
      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts slug={post.slug} />
      </Suspense>

      {/* 评论 */}
      <div
        className="butterfly-card-base butterfly-onload-animation p-6"
        style={{ animationDelay: "450ms" }}
      >
        <ButterflyCommentSection postId={post.id} />
      </div>

      {/* 受限文章门禁：未解锁时以毛玻璃遮罩覆盖全页，不泄露正文 */}
      <PostGateShell post={post} />
    </div>
  );
}
