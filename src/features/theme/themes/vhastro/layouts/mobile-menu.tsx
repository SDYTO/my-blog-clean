import { Link, useRouteContext } from "@tanstack/react-router";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import type { NavOption, UserInfo } from "@/features/theme/contract/layouts";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

interface MobileMenuProps {
  navOptions: Array<NavOption>;
  isOpen: boolean;
  onClose: () => void;
  user?: UserInfo;
  logout: () => Promise<void>;
}

/**
 * vhAstro 移动端侧栏
 * 对应源主题 src/components/MobileSidebar/MobileSidebar.less：
 *   全屏半透明遮罩 + **左侧**抽屉（max-width 17.6rem）；
 *   菜单项默认灰字，hover / 当前项为主色底 + 白字。
 */
export function MobileMenu({
  navOptions,
  isOpen,
  onClose,
  user,
  logout,
}: MobileMenuProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  const rowBase =
    "flex h-9 w-full items-center gap-[0.618rem] rounded-[0.375rem] px-[0.5rem] text-[1rem] font-semibold text-(--vhastro-font-66) transition-all duration-300";
  const rowTone =
    "hover:bg-(--vhastro-primary) hover:text-white";
  const rowActive = "bg-(--vhastro-primary) text-white";

  return (
    <>
      {/* 遮罩 */}
      <div
        className={cn(
          "fixed inset-0 z-100 bg-black/25 transition-opacity duration-200",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      {/* 左侧抽屉 */}
      <div
        className={cn(
          "fixed left-0 top-0 z-110 flex h-full w-full max-w-[17.6rem] flex-col overflow-y-auto bg-(--vhastro-card-bg) p-4 transition-transform duration-200 ease-in",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* 作者信息 */}
        <div className="mb-4 flex flex-col items-center px-2 pt-4 text-center">
          <img
            src={siteConfig.theme.vhastro.avatar}
            alt={siteConfig.author}
            className="h-[4.5rem] w-[4.5rem] rounded-[1rem] border border-(--vhastro-font-16) object-cover"
          />
          <div className="mt-3 text-[1.15rem] font-semibold vhastro-text-90">
            {siteConfig.author}
          </div>
          <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed vhastro-text-50">
            {siteConfig.description}
          </p>
        </div>

        {/* 菜单 */}
        <nav className="flex w-full flex-col gap-[0.26rem] rounded-[0.75rem] bg-(--vhastro-font-6) px-[0.618rem] py-4">
          {navOptions.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              onClick={onClose}
              className={cn(rowBase, rowTone)}
              activeProps={{ className: cn(rowBase, rowActive) }}
            >
              {item.label}
            </Link>
          ))}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={onClose}
              className={cn(rowBase, rowTone, "gap-2")}
            >
              <Settings size={15} strokeWidth={2} />
              {m.profile_admin_dashboard_vhastro()}
            </Link>
          )}
        </nav>

        {/* 用户区 */}
        <div className="mt-auto w-full pt-4">
          {user ? (
            <div className="flex items-center gap-3 rounded-[0.75rem] border border-(--vhastro-font-16) p-[0.618rem]">
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-(--vhastro-font-6)">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <UserIcon size={16} className="vhastro-text-50" />
                  </span>
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium vhastro-text-90">
                  {user.name}
                </span>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="truncate text-xs vhastro-text-50 transition-colors hover:text-(--vhastro-primary)"
                >
                  {m.profile_title()}
                </Link>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                aria-label={m.profile_logout_vhastro()}
                className="rounded-md p-1.5 text-(--vhastro-error) transition-colors hover:bg-(--vhastro-font-6)"
              >
                <LogOut size={16} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="vhastro-btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-[0.5rem] text-sm font-medium"
            >
              <UserIcon size={16} strokeWidth={2} />
              {m.nav_login_register()}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
