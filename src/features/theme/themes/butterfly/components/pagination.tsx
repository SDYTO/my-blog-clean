import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

/**
 * Butterfly 分页（对应源主题 .pagination：方形按钮 + 卡片阴影，hover 变主色）
 */
export function Pagination({
  page,
  total,
  pageSize,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: PaginationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const startEditing = () => {
    setDraft(String(page));
    setIsEditing(true);
  };

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    }
    setIsEditing(false);
  };

  const navBtn =
    "flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium butterfly-text-75 shadow-[var(--butterfly-card-shadow)] transition-all bg-(--butterfly-card-bg) hover:bg-(--butterfly-primary) hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      className="flex w-full items-center justify-between gap-3"
      aria-label={m.pagination_page({ page, pages: totalPages })}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        className={navBtn}
      >
        <ChevronLeft size={16} />
        {m.pagination_prev()}
      </button>

      <div className="flex select-none items-center gap-1.5 whitespace-nowrap text-sm butterfly-text-50 tabular-nums">
        <span className="shrink-0">{m.pagination_page_prefix()}</span>

        {isEditing ? (
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                setIsEditing(false);
              }
            }}
            onBlur={commit}
            className="h-9 w-14 rounded-[8px] border border-(--butterfly-input-border) bg-(--butterfly-input-bg) text-center text-sm tabular-nums butterfly-text-90 outline-none transition-colors focus:border-(--butterfly-primary)"
            aria-label={m.pagination_page_input()}
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            title={m.pagination_page_input_hint({ pages: totalPages })}
            className={cn(
              "h-9 min-w-10 rounded-[8px] px-1.5 text-sm font-semibold tabular-nums transition-all",
              "butterfly-text-90 hover:bg-(--butterfly-primary) hover:text-white",
            )}
          >
            {page}
          </button>
        )}

        <span className="shrink-0">
          <span className="opacity-60">/</span>
          &nbsp;{totalPages}
          {m.pagination_page_suffix() && <>&nbsp;{m.pagination_page_suffix()}</>}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className={navBtn}
      >
        {m.pagination_next()}
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
