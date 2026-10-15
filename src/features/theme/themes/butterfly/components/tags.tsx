import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Tags as TagsIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { tagsQueryOptions } from "@/features/tags/queries";
import { m } from "@/paraglide/messages";

export function TagsSkeleton() {
  return (
    <div className="butterfly-card-base px-[23px] py-[16px]">
      <Skeleton className="mb-3 h-5 w-20" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded" />
        ))}
      </div>
    </div>
  );
}

/**
 * Butterfly 侧边栏标签云（对应源主题 .aside-tags）
 */
export function Tags() {
  const { data: tags } = useSuspenseQuery(tagsQueryOptions);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setShowToggle(containerRef.current.scrollHeight > 150);
    }
  }, [tags]);

  if (tags.length === 0) return null;

  return (
    <div className="butterfly-card-base px-[23px] py-[16px]">
      <h2 className="mb-2 flex items-center gap-1 text-base font-semibold butterfly-text-90">
        <TagsIcon size={17} strokeWidth={1.75} className="text-[#cf9128]" />
        {m.tags_title()}
      </h2>

      <div
        ref={containerRef}
        className={`flex flex-wrap gap-x-1 gap-y-1 overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isExpanded || !showToggle ? "max-h-250" : "max-h-[150px]"
        }`}
      >
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to="/posts"
            search={{ tagName: tag.name }}
            className="px-1 py-0.5 text-sm butterfly-text-75 transition-transform hover:-translate-y-[3px] hover:text-(--butterfly-primary)"
          >
            {tag.name}
            <span className="ml-0.5 text-[0.7rem] opacity-60">
              （{tag.postCount}）
            </span>
          </Link>
        ))}
      </div>

      {showToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex w-full items-center justify-center gap-1 text-sm butterfly-text-50 transition-colors hover:text-(--butterfly-primary)"
        >
          {isExpanded ? (
            <>
              {m.tags_collapse()} <ChevronUp size={16} />
            </>
          ) : (
            <>
              {m.tags_expand()} <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
