import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/**
 * vhAstro 返回顶部
 * 对应源主题 src/components/BackTop/BackTop.less：
 *   圆形按钮（2.6rem）固定于右下，位置随内容区宽度自适应
 *   （--vh-back-top = 主体两侧留白 / 2 + 1rem），滚动后滑入。
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(
        (window.scrollY || document.documentElement.scrollTop) >
          window.innerHeight * 0.5,
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={m.post_back_to_top()}
      style={{
        right:
          "calc((calc(100vw - 2rem) - min(calc(100vw - 2rem), var(--vhastro-max-width))) / 2 + 1rem)",
      }}
      className={cn(
        "fixed bottom-[2rem] z-9 flex h-[2.6rem] w-[2.6rem] items-center justify-center overflow-hidden rounded-full border border-(--vhastro-font-16) bg-(--vhastro-card-bg) shadow-[var(--vhastro-card-shadow)] transition-[transform,opacity] duration-200 vhastro-text-75 hover:text-(--vhastro-primary)",
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-[1rem] opacity-0",
      )}
    >
      <ArrowUp size={18} strokeWidth={2} />
    </button>
  );
}
