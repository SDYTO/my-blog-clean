import { FileQuestion, Pencil } from "lucide-react";
import { MarkdownContent } from "@/features/about/components/markdown-content";
import type { AboutPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { VhastroCommentSection } from "../../components/comments/view/comment-section";

const markdownClassName =
  "prose dark:prose-invert prose-base max-w-none! vhastro-custom-md";

export function AboutPage({ article, isAdmin, onStartEdit }: AboutPageProps) {
  if (!article) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div
          className="vhastro-card-base p-12 md:p-16 flex flex-col items-center justify-center text-center vhastro-onload-animation"
          style={{ animationDelay: "150ms" }}
        >
          <div className="w-16 h-16 rounded-full bg-(--vhastro-btn-regular-bg) flex items-center justify-center mb-6 text-(--vhastro-btn-content)">
            <FileQuestion size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold vhastro-text-90 mb-3">
            {m.about_empty_title()}
          </h1>
          <p className="text-sm vhastro-text-50 max-w-sm leading-relaxed mb-8">
            {m.about_empty_desc()}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={onStartEdit}
              className="vhastro-btn-regular rounded-lg h-10 px-6 flex items-center justify-center gap-2 text-sm"
            >
              <Pencil size={14} strokeWidth={1.5} />
              <span>{m.about_admin_create()}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="vhastro-card-base z-10 px-6 md:px-9 pt-6 pb-6 relative w-full vhastro-onload-animation">
        <div className="flex flex-row flex-wrap vhastro-text-30 gap-5 mb-3 transition">
          {isAdmin && (
            <button
              type="button"
              onClick={onStartEdit}
              className="flex flex-row items-center vhastro-text-30 hover:vhastro-text-90 transition animate-in fade-in duration-500"
            >
              <div className="transition h-6 w-6 rounded-md bg-black/5 dark:bg-white/10 vhastro-text-50 flex items-center justify-center mr-2">
                <Pencil strokeWidth={1.5} size={16} />
              </div>
              <div className="text-sm">{m.about_edit()}</div>
            </button>
          )}
        </div>

        {article.title ? (
          <h1 className="transition w-full block font-bold mb-6 text-3xl md:text-[2.25rem]/[2.75rem] vhastro-text-90">
            {article.title}
          </h1>
        ) : null}

        <MarkdownContent
          markdown={article.markdown}
          preRenderedHtml={article.renderedHtml}
          className={markdownClassName}
        />
      </div>

      {/* Comments Section (separate container) */}
      <div
        className="vhastro-card-base p-6 vhastro-onload-animation"
        style={{ animationDelay: "450ms" }}
      >
        <VhastroCommentSection aboutArticleId={article.id} />
      </div>
    </div>
  );
}
