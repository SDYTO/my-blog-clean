import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { tagsQueryOptions } from "@/features/tags/queries";
import { m } from "@/paraglide/messages";

export function TagsSkeleton() {
  return (
    <div className="vhastro-aside-item">
      <Skeleton className="h-5 w-16 self-start" />
      <div className="flex w-full flex-wrap gap-[0.68rem]">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-14 rounded-[0.38rem]" />
        ))}
      </div>
    </div>
  );
}

/**
 * 侧栏标签云
 * 对应源主题 Aside.less `.vh-aside-tags`：
 *   `#tag` 前缀 + 计数（灰色小字），hover 变主色
 */
export function Tags() {
  const { data: tags } = useSuspenseQuery(tagsQueryOptions);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setShowToggle(containerRef.current.scrollHeight > 160);
    }
  }, [tags]);

  if (tags.length === 0) return null;

  return (
    <div className="vhastro-aside-item">
      <h3 className="vhastro-aside-title">{m.sidebar_tags_vhastro()}</h3>

      <div
        ref={containerRef}
        className={`vhastro-toc-scrollbar flex w-full flex-wrap gap-[0.68rem] overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isExpanded || !showToggle ? "max-h-[30rem]" : "max-h-40 overflow-y-auto"
        }`}
      >
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to="/posts"
            search={{ tagName: tag.name }}
            className="group flex h-fit w-fit items-center gap-[0.18rem]"
          >
            <span className="text-[0.8rem] leading-6 vhastro-text-75 transition-colors group-hover:text-(--vhastro-primary)">
              #{tag.name}
            </span>
            <em className="text-[0.688rem] not-italic vhastro-text-40">
              {tag.postCount}
            </em>
          </Link>
        ))}
      </div>

      {showToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-center gap-1 pt-[0.4rem] text-[0.8rem] vhastro-text-50 transition-colors hover:text-(--vhastro-primary)"
        >
          {isExpanded ? (
            <>
              {m.tags_collapse()} <ChevronUp size={14} />
            </>
          ) : (
            <>
              {m.tags_expand()} <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
