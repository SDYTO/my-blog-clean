import { useLocation, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import type { PublicLayoutProps } from "@/features/theme/contract/layouts";
import { BackToTop } from "../components/control/back-to-top";
import { Sidebar } from "../components/sidebar";
import { Footer } from "./footer";
import { MobileMenu } from "./mobile-menu";
import { Navbar } from "./navbar";

/**
 * Butterfly 公共布局
 *
 * 结构与 halo-theme-butterfly 的 `#Butterfly` 一致：
 *   header(导航 + 第一屏 above) → main(content + aside) → footer → 移动端侧栏 → 侧边工具
 *
 * 第一屏：首页 100svh，内页 500px（移动端更矮），背景图取自主题设置。
 */
export function PublicLayout({
  children,
  navOptions,
  user,
  isSessionLoading,
  logout,
}: PublicLayoutProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  // 文章详情页的侧栏由页面内的目录（TOC）接管（对应源主题 views/aside::post）
  const isPostPage = location.pathname.startsWith("/post/");

  const currentNav = navOptions.find(
    (option) => option.to === location.pathname,
  );
  const bannerTitle = isHomePage
    ? siteConfig.title
    : (currentNav?.label ?? siteConfig.title);
  const bannerSubtitle = isHomePage ? siteConfig.description : "";

  const theme = siteConfig.theme.butterfly;
  const bannerImage = isHomePage
    ? theme.homeBg
    : theme.pageBg || theme.homeBg;

  return (
    <div id="Butterfly" className="relative flex min-h-screen flex-col">
      <MobileMenu
        navOptions={navOptions}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        logout={logout}
      />

      <header className="header relative w-full">
        <Navbar
          navOptions={navOptions}
          user={user}
          isSessionLoading={isSessionLoading}
          onMenuClick={() => setIsMenuOpen(true)}
        />

        <section
          id="butterfly-banner"
          className={`above relative flex w-full items-center justify-center overflow-hidden bg-black/60 transition-[height] duration-300 ${
            isHomePage
              ? "h-[100svh] max-md:h-[80svh]"
              : "h-[500px] max-lg:h-[380px] max-md:h-[280px]"
          }`}
          style={
            bannerImage
              ? {
                  backgroundImage: `url(${bannerImage})`,
                  backgroundPosition: "center center",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                }
              : undefined
          }
        >
          <div className="above-info absolute w-full px-[10px] text-center">
            <h1
              className={`above-title font-bold leading-[1.5] text-white [text-shadow:2px_2px_4px_rgba(0,0,0,0.15)] ${
                isHomePage
                  ? "text-[2.3rem] max-md:text-[1.85rem]"
                  : "text-[2.1rem] max-md:text-[1.6rem]"
              }`}
            >
              {bannerTitle}
            </h1>
            {bannerSubtitle && (
              <div
                className={`above-subtitle mt-2 leading-[1.5] text-white/80 [text-shadow:2px_2px_4px_rgba(0,0,0,0.15)] ${
                  isHomePage
                    ? "text-[1.5rem] max-md:text-[1.15rem]"
                    : "text-[1.1rem]"
                }`}
              >
                {bannerSubtitle}
              </div>
            )}
          </div>
        </section>
      </header>

      <main className="main mx-auto flex w-full max-w-[1250px] flex-row items-start gap-[18px] px-[15px] py-[28px] max-[1100px]:flex-col max-md:px-2 max-md:py-[18px]">
        <section className="content min-w-0 flex-1">{children}</section>
        <aside
          className={
            isPostPage
              ? "aside w-[25%] shrink-0 max-[1100px]:hidden"
              : "aside w-[25%] shrink-0 max-[1100px]:w-full"
          }
        >
          {isPostPage ? (
            <div
              id="butterfly-aside-slot"
              className="sticky top-[80px] hidden min-[1100px]:block"
            />
          ) : (
            <Sidebar />
          )}
        </aside>
      </main>

      <Footer />

      <BackToTop />
    </div>
  );
}
