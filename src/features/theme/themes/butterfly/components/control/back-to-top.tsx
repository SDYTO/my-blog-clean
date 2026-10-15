import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/**
 * Butterfly 侧边工具按钮（对应源主题 .side-btn > .button）
 * 滚动过第一屏后于右下角浮现。
 */
export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const banner = document.getElementById("butterfly-banner");
      const threshold = (banner?.offsetHeight ?? 500) - 120;
      setIsVisible((window.scrollY || document.documentElement.scrollTop) > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={m.post_back_to_top()}
      title={m.post_back_to_top()}
      className={cn(
        "fixed bottom-[40px] right-[30px] z-40 flex h-10 w-10 items-center justify-center rounded-[8px] bg-(--butterfly-primary) text-white shadow-[0_3px_8px_6px_rgba(7,17,27,0.12)] transition-all duration-300 hover:bg-(--butterfly-primary-hover) active:scale-90",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp size={20} strokeWidth={2.25} />
    </button>
  );
}
