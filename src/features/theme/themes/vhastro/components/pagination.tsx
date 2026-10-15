import { ChevronLeft, ChevronRight } from "lucide-react";
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
 * vhAstro 分页
 * 对应源主题 src/components/Pagination/Pagination.less：
 *   2rem 方形按钮 + 0.5rem 圆角 + 白底阴影，当前页灰蓝底白字，
 *   悬浮为主色调浅灰蓝底。
 */
export function Pagination({
  page,
  total,
  pageSize,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}: PaginationProps) {
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  // 当前页左右各展开 2 页
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const pages: Array<number> = [];
  for (let p = start; p <= end; p += 1) pages.push(p);

  const baseBtn =
    "flex h-[2rem] w-[2rem] items-center justify-center rounded-[0.5rem] bg-(--vhastro-card-bg) text-[0.875rem] shadow-[var(--vhastro-card-shadow)] transition-colors select-none";

  return (
    <nav
      aria-label={m.pagination_page({ page, pages: totalPages })}
      className="flex flex-wrap items-center justify-center gap-[0.5rem] py-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        aria-label={m.pagination_prev()}
        className={`${baseBtn} vhastro-text-50 hover:bg-(--vhastro-primary-66) hover:text-white disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronLeft size={16} />
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className={`${baseBtn} vhastro-text-50 hover:bg-(--vhastro-primary-66) hover:text-white`}
          >
            1
          </button>
          {start > 2 && <span className="px-1 vhastro-text-40">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? `${baseBtn} cursor-default bg-(--vhastro-primary) font-medium text-white`
              : `${baseBtn} vhastro-text-50 hover:bg-(--vhastro-primary-66) hover:text-white`
          }
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 vhastro-text-40">…</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`${baseBtn} vhastro-text-50 hover:bg-(--vhastro-primary-66) hover:text-white`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        aria-label={m.pagination_next()}
        className={`${baseBtn} vhastro-text-50 hover:bg-(--vhastro-primary-66) hover:text-white disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
