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
 * Butterfly 移动端侧栏（对应源主题 .side-bar）
 * 右侧 300px 抽屉：头像 + 昵称 + 菜单 + 用户操作。
 */
export function MobileMenu({
  navOptions,
  isOpen,
  onClose,
  user,
  logout,
}: MobileMenuProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/60 backdrop-blur-[20px] transition-opacity duration-500",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed right-0 top-0 z-[110] flex h-full w-[300px] flex-col overflow-y-auto rounded-l-[12px] border-l border-black/5 bg-[#f6f8fa] shadow-2xl transition-transform duration-500 dark:border-white/5 dark:bg-[#121212]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* 作者信息 */}
        <div className="flex flex-col items-center px-6 pt-8 pb-4">
          <img
            src={siteConfig.theme.butterfly.avatar}
            alt={siteConfig.author}
            className="h-[100px] w-[100px] rounded-full border-[5px] border-white object-cover dark:border-[#1b1c20]"
          />
          <div className="mt-3 text-[1.3rem] font-bold butterfly-text-90">
            {siteConfig.author}
          </div>
          <p className="mt-1 line-clamp-2 text-center text-sm butterfly-text-50">
            {siteConfig.description}
          </p>
        </div>

        <div className="mx-5 border-t border-dashed border-black/10 dark:border-white/15" />

        {/* 菜单 */}
        <nav className="flex flex-col gap-2 px-5 py-4">
          {navOptions.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              onClick={onClose}
              className="rounded-lg border border-black/5 bg-white px-6 py-2 text-[1.1rem] font-medium butterfly-text-90 transition-colors hover:border-(--butterfly-primary)/40 hover:text-(--butterfly-primary) dark:border-white/5 dark:bg-[#1b1c20]"
              activeProps={{
                className:
                  "border-(--butterfly-primary)/50 text-(--butterfly-primary)",
              }}
            >
              {item.label}
            </Link>
          ))}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg border border-black/5 bg-white px-6 py-2 text-[1.1rem] font-medium butterfly-text-90 transition-colors hover:border-(--butterfly-primary)/40 hover:text-(--butterfly-primary) dark:border-white/5 dark:bg-[#1b1c20]"
            >
              <Settings size={16} strokeWidth={1.75} />
              {m.profile_admin_dashboard_butterfly()}
            </Link>
          )}
        </nav>

        <div className="mt-auto px-5 pb-6">
          <div className="mx-0 mb-4 border-t border-dashed border-black/10 dark:border-white/15" />

          {user ? (
            <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-white p-3 dark:border-white/5 dark:bg-[#1b1c20]">
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <UserIcon size={16} className="butterfly-text-50" />
                  </span>
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium butterfly-text-90">
                  {user.name}
                </span>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="truncate text-xs butterfly-text-50 hover:text-(--butterfly-primary)"
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
                aria-label={m.profile_logout_butterfly()}
                className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-black/5 hover:text-red-600 dark:hover:bg-white/10"
              >
                <LogOut size={16} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="butterfly-btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium"
            >
              <UserIcon size={16} strokeWidth={1.75} />
              {m.nav_login_register()}
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
