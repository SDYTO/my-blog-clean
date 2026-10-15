import { Link, useRouteContext } from "@tanstack/react-router";
import { LogIn, Menu, Search, User as UserIcon } from "lucide-react";
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

/**
 * vhAstro 顶部导航
 * 对应源主题 src/components/Header/Header.astro + Header.less：
 *   固定 66px、`backdrop-filter: blur(2rem)`、rgba(255,255,255,.36) 半透明底 + 阴影；
 *   左侧站点标题，右侧菜单（hover 为主色药丸），最右是搜索 / 主题 / 语言 / 用户。
 */
export function Navbar({
  onMenuClick,
  user,
  navOptions,
  isSessionLoading,
}: NavbarProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  const linkBase =
    "relative flex h-[2.2rem] items-center gap-[0.28rem] rounded-[0.5rem] px-[0.5rem] text-[0.95rem] font-semibold transition-colors duration-200";
  const linkTone =
    "vhastro-text-90 hover:bg-(--vhastro-primary-88) hover:text-white";
  const activeTone = "bg-(--vhastro-primary-88) text-white";

  return (
    <header className="fixed left-0 top-0 z-9 h-(--vhastro-header-height) w-full bg-(--vhastro-header-bg) shadow-[var(--vhastro-card-shadow)] backdrop-blur-[2rem] transition-colors duration-200">
      <section className="mx-auto flex h-full w-full max-w-(--vhastro-max-width) items-center px-[0.88rem]">
        {/* 站点标题 */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-[0.618rem] py-[0.266rem] transition-opacity hover:opacity-80"
        >
          <img
            src="/images/avatar.png"
            alt={siteConfig.title}
            aria-hidden
            className="h-[1.5rem] w-auto object-contain"
          />
          <span className="pt-[0.188rem] text-[0.98rem] font-bold vhastro-text-90">
            {siteConfig.title}
          </span>
        </Link>

        {/* 菜单 */}
        <nav className="ml-auto hidden h-full items-center gap-[1.18rem] md:flex">
          {navOptions.map((option) => (
            <Link
              key={option.id}
              to={option.to}
              className={cn(linkBase, linkTone)}
              activeProps={{ className: cn(linkBase, activeTone) }}
            >
              {option.label}
            </Link>
          ))}
        </nav>

        {/* 操作区 */}
        <div className="ml-auto flex items-center gap-[0.5rem] md:ml-[1.18rem]">
          <Link
            to="/search"
            aria-label={m.nav_search()}
            className="flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-[0.5rem] transition-colors vhastro-text-90 hover:bg-(--vhastro-primary-88) hover:text-white active:scale-90"
          >
            <Search size={18} strokeWidth={1.9} />
          </Link>

          <ThemeToggle className="flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-[0.5rem] bg-transparent! p-0! transition-colors vhastro-text-90 hover:bg-(--vhastro-primary-88) hover:text-white active:scale-90 [&_div]:h-auto! [&_div]:w-auto! [&_svg]:h-[18px]! [&_svg]:w-[18px]!" />

          <div className="hidden md:block">
            <LanguageSwitcher className="flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-[0.5rem] bg-transparent! p-0! transition-colors vhastro-text-90 hover:bg-(--vhastro-primary-88) hover:text-white active:scale-90 [&_svg]:h-[18px]! [&_svg]:w-[18px]!" />
          </div>

          <div className="hidden items-center md:flex">
            {isSessionLoading ? (
              <Skeleton className="h-8 w-8 rounded-[0.5rem]" />
            ) : user ? (
              <Link
                to="/profile"
                aria-label={m.profile_title()}
                className="ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-(--vhastro-font-16) transition-transform active:scale-90"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-(--vhastro-btn-regular-bg)">
                    <UserIcon
                      size={17}
                      strokeWidth={1.9}
                      className="text-(--vhastro-primary)"
                    />
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label={m.nav_login()}
                className="flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-[0.5rem] transition-colors vhastro-text-90 hover:bg-(--vhastro-primary-88) hover:text-white active:scale-90"
              >
                <LogIn size={18} strokeWidth={1.9} />
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={onMenuClick}
            aria-label={m.common_open_menu()}
            className="flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-[0.5rem] transition-colors vhastro-text-90 hover:bg-(--vhastro-primary-88) hover:text-white active:scale-90 md:hidden"
          >
            <Menu size={20} strokeWidth={1.9} />
          </button>
        </div>
      </section>
    </header>
  );
}
