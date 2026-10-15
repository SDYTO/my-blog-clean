import { Link } from "@tanstack/react-router";
import { Clock, FileText, Pencil } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PostGateShell } from "@/features/posts/components/post-gate-shell";
import type { PostPageProps } from "@/features/theme/contract/pages";
import { VhastroCommentSection } from "@/features/theme/themes/vhastro/components/comments/view/comment-section";
import { ContentRenderer } from "@/features/theme/themes/vhastro/components/content/content-renderer";
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
 * vhAstro 文章详情页
 * 对应源主题 src/styles/Article.less（article.vh-article-main）：
 *   header（白底、上圆角、阴影：标题 + 元信息）
 *   + main（白底、下圆角、更深阴影：正文 + 标签列表）
 * 桌面端目录注入左侧 aside 顶部（#vhastro-aside-slot），小屏用浮动抽屉。
 */
export function PostPage({ post, hideAdminEdit }: PostPageProps) {
  const { data: session } = authClient.useSession();
  const wordCount = post.readTimeInMinutes * 300;

  const [asideSlot, setAsideSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setAsideSlot(document.getElementById("vhastro-aside-slot"));
  }, []);

  return (
    <div className="relative flex w-full flex-col gap-[1rem]">
      {/* 桌面端侧栏目录（注入 aside 顶部） */}
      {asideSlot &&
        createPortal(
          <TableOfContents headers={post.toc ?? []} card />,
          asideSlot,
        )}

      {/* 小屏浮动目录抽屉 */}
      <TocDrawer headers={post.toc ?? []} />

      <article className="relative z-10 flex w-full flex-col">
        {/* ── header：标题 + 元信息 ── */}
        <header className="flex w-full flex-col overflow-hidden rounded-t-[0.5rem] bg-(--vhastro-card-bg) px-[1rem] pb-[1rem] pt-[2rem] shadow-[var(--vhastro-card-shadow)]">
          {/* 字数 / 阅读时长 / 编辑入口 */}
          <div className="mb-3 flex flex-row flex-wrap items-center gap-5 text-[0.8rem] vhastro-text-30">
            <div className="flex flex-row items-center">
              <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-[0.4rem] bg-(--vhastro-font-6) vhastro-text-50">
                <FileText strokeWidth={1.7} size={15} />
              </div>
              <span>{m.post_word_count({ count: wordCount })}</span>
            </div>
            <div className="flex flex-row items-center">
              <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-[0.4rem] bg-(--vhastro-font-6) vhastro-text-50">
                <Clock strokeWidth={1.7} size={15} />
              </div>
              <span>{m.read_time({ count: post.readTimeInMinutes })}</span>
            </div>
            {session?.user.role === "admin" && !hideAdminEdit && (
              <Link
                to="/admin/posts/edit/$id"
                params={{ id: String(post.id) }}
                className="flex flex-row items-center transition-colors hover:text-(--vhastro-primary)"
              >
                <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-[0.4rem] bg-(--vhastro-font-6) vhastro-text-50">
                  <Pencil strokeWidth={1.7} size={15} />
                </div>
                <span>{m.post_edit()}</span>
              </Link>
            )}
          </div>

          {/* 标题 */}
          <h1
            className="mb-[0.68rem] block w-full text-[1.58rem] font-bold leading-snug vhastro-text-90 max-md:text-[1.3rem]"
            style={{ viewTransitionName: `post-title-${post.slug}` }}
          >
            {post.title}
          </h1>

          <PostMeta post={post} />
        </header>

        {/* ── main：正文 ── */}
        <main className="flex w-full flex-col overflow-hidden rounded-b-[0.5rem] bg-(--vhastro-card-bg) p-[1rem] shadow-[0_12px_8px_6px_rgba(7,17,27,0.05)] dark:shadow-[0_12px_8px_6px_rgba(0,0,0,0.24)]">
          <PostSummary summary={post.summary} />

          <div className="prose vhastro-custom-md max-w-none! dark:prose-invert prose-base">
            <ContentRenderer content={post.contentJson} />
          </div>

          {/* 正文结束提示 */}
          <div className="my-8 flex w-full items-center justify-center">
            <div className="h-px w-full bg-linear-to-r from-transparent via-(--vhastro-meta-divider) to-transparent opacity-20" />
            <span className="mx-4 whitespace-nowrap font-mono text-sm tracking-widest text-(--vhastro-meta-divider) opacity-50">
              END
            </span>
            <div className="h-px w-full bg-linear-to-r from-(--vhastro-meta-divider) via-transparent to-transparent opacity-20" />
          </div>

          {/* 标签列表（源主题 .tag-list） */}
          {(post.tags ?? []).length > 0 && (
            <div className="relative flex flex-wrap gap-[0.58rem] border-t border-(--vhastro-font-16) py-[1rem]">
              {(post.tags ?? []).map((tag) => (
                <Link
                  key={tag.id}
                  to="/posts"
                  search={{ tagName: tag.name }}
                  className="flex h-[1.5rem] w-fit items-center gap-[0.28rem] rounded-[0.28rem] bg-(--vhastro-primary-16) px-[0.3125rem] text-[0.76rem] text-(--vhastro-info) transition-colors hover:bg-(--vhastro-primary-28) hover:text-(--vhastro-primary)"
                >
                  <span className="opacity-60">#</span>
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </main>
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
      <div className="vhastro-card-base vhastro-onload-animation p-6" style={{ animationDelay: "450ms" }}>
        <VhastroCommentSection postId={post.id} />
      </div>

      {/* 受限文章门禁：未解锁时以毛玻璃遮罩覆盖全页，不泄露正文 */}
      <PostGateShell post={post} />
    </div>
  );
}
