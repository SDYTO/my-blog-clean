import { Link, useRouteContext } from "@tanstack/react-router";
import { LogIn, Menu, Search, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavOption, UserInfo } from "@/features/theme/contract/layouts";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { LanguageSwitcher } from "./language-switcher";

interface NavbarProps {
  navOptions: Array<NavOption>;
  onMenuClick: () => void;
  isLoading?: boolean;
  user?: UserInfo;
  isSessionLoading?: boolean;
}

const NAVBAR_HEIGHT = 60;

/**
 * Butterfly 顶部导航（对应源主题 src/html/views/nav.html + scss/core/nav.scss）
 *
 * 未滚动时透明地叠加在第一屏上（白字 + 文字阴影），
 * 滚动过第一屏后切换为半透明卡片背景 + 阴影（深色文字）。
 */
export function Navbar({
  onMenuClick,
  user,
  navOptions,
  isSessionLoading,
}: NavbarProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const banner = document.getElementById("butterfly-banner");
      const threshold = (banner?.offsetHeight ?? 500) - NAVBAR_HEIGHT;
      setIsStuck(
        (window.scrollY || document.documentElement.scrollTop) >= threshold,
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const linkBase =
    "relative flex h-[60px] items-center px-3 text-[0.95rem] font-medium transition-colors xl:px-4";
  const linkTone = isStuck
    ? "butterfly-text-90 hover:text-(--butterfly-primary)"
    : "text-white/95 hover:text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]";
  const controlTone = isStuck
    ? "butterfly-text-90 hover:text-(--butterfly-primary)"
    : "text-white/95 hover:text-white";

  return (
    <nav
      className={cn(
        "z-50 flex h-[60px] w-full items-center justify-between gap-4 px-[38px] transition-all duration-300 max-md:px-4",
        isStuck
          ? "fixed left-0 right-0 top-0 border-b border-black/5 bg-white/80 shadow-[0_5px_6px_-5px_rgba(133,133,133,0.6)] backdrop-blur-md dark:border-white/5 dark:bg-[rgba(18,18,18,0.8)]"
          : "absolute left-0 right-0 top-0 bg-transparent",
      )}
    >
      {/* 站点标题 */}
      <div className="min-w-0 shrink-0">
        <Link
          to="/"
          className={cn(
            "block truncate text-[1.15rem] font-bold transition-colors",
            isStuck
              ? "butterfly-text-90 hover:text-(--butterfly-primary)"
              : "text-white [text-shadow:2px_2px_4px_rgba(0,0,0,0.15)]",
          )}
        >
          {siteConfig.title}
        </Link>
      </div>

      {/* 菜单 */}
      <menu className="hidden flex-1 items-center justify-end gap-1 md:flex">
        {navOptions.map((option) => (
          <Link
            key={option.id}
            to={option.to}
            className={cn(
              linkBase,
              linkTone,
              "after:absolute after:bottom-[16px] after:left-0 after:right-0 after:h-[3px] after:origin-center after:scale-x-[0.25] after:rounded-t-[2px] after:bg-(--butterfly-primary) after:opacity-0 after:transition-all after:duration-300 hover:after:scale-x-100 hover:after:opacity-100",
            )}
            activeProps={{
              className: cn(
                linkBase,
                isStuck
                  ? "text-(--butterfly-primary)"
                  : "text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.3)]",
              ),
            }}
          >
            {option.label}
          </Link>
        ))}
      </menu>

      {/* 操作区 */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          to="/search"
          aria-label={m.nav_search()}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:scale-90",
            controlTone,
            !isStuck && "hover:bg-white/10",
          )}
        >
          <Search size={18} strokeWidth={1.75} />
        </Link>

        <ThemeToggle
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg bg-transparent! p-0! transition-colors active:scale-90 [&_div]:h-auto! [&_div]:w-auto! [&_svg]:h-[18px]! [&_svg]:w-[18px]!",
            controlTone,
            !isStuck && "hover:bg-white/10",
          )}
        />

        <div className="hidden md:block">
          <LanguageSwitcher
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-transparent! p-0! transition-colors active:scale-90 [&_svg]:h-[18px]! [&_svg]:w-[18px]!",
              controlTone,
              !isStuck && "hover:bg-white/10",
            )}
          />
        </div>

        <div className="hidden items-center md:flex">
          {isSessionLoading ? (
            <Skeleton className="h-8 w-8 rounded-lg" />
          ) : user ? (
            <Link
              to="/profile"
              aria-label={m.profile_title()}
              className="ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-transform active:scale-90"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <UserIcon size={18} strokeWidth={1.75} className="text-white" />
                </span>
              )}
            </Link>
          ) : (
            <Link
              to="/login"
              aria-label={m.nav_login()}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:scale-90",
                controlTone,
                !isStuck && "hover:bg-white/10",
              )}
            >
              <LogIn size={18} strokeWidth={1.75} />
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={onMenuClick}
          aria-label={m.common_open_menu()}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:scale-90 md:hidden",
            controlTone,
            !isStuck && "hover:bg-white/10",
          )}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  );
}
