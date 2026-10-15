import { useLocation, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { PublicLayoutProps } from "@/features/theme/contract/layouts";
import { BackToTop } from "../components/control/back-to-top";
import { Sidebar } from "../components/sidebar";
import { Footer } from "./footer";
import { MobileMenu } from "./mobile-menu";
import { Navbar } from "./navbar";

/**
 * vhAstro 公共布局
 *
 * 结构与源主题 src/layouts/Layout/Layout.astro + Layout.less 一致：
 *   Header（固定毛玻璃导航）→ main（ MainHeader 首屏 + main-inner ）
 *   main-inner 为 `flex-direction: row-reverse`，
 *   DOM 顺序是 content → aside，视觉上 **侧栏在左、正文在右**。
 *   → Footer → 返回顶部 / 移动端侧栏
 *
 * 首屏 MainHeader 高度：首页 38.88rem、内页 28.88rem；
 * 首页含圆形头像（hover 旋转 18.88°）+ 作者名 + 打字机简介。
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

  // 文章详情页在侧栏顶部注入目录（TOC）卡片
  const isPostPage = location.pathname.startsWith("/post/");

  const currentNav = navOptions.find((o) => o.to === location.pathname);
  const bannerTitle = isHomePage
    ? siteConfig.author || siteConfig.title
    : (currentNav?.label ?? siteConfig.title);

  const theme = siteConfig.theme.vhastro;
  const bannerImage = isHomePage ? theme.homeBg : theme.pageBg || theme.homeBg;

  return (
    <div id="vhAstro" className="relative flex min-h-screen flex-col">
      <MobileMenu
        navOptions={navOptions}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        logout={logout}
      />

      <Navbar
        navOptions={navOptions}
        user={user}
        isSessionLoading={isSessionLoading}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      <main className="flex w-full flex-1 flex-col items-center pt-(--vhastro-header-height)">
        {/* ── 首屏 MainHeader（源主题 src/components/MainHeader） ── */}
        <section
          className={`relative flex w-full flex-col items-center justify-center overflow-hidden ${
            isHomePage
              ? "h-[38.88rem] max-lg:h-[26rem]"
              : "h-[28.88rem] max-lg:h-[22rem]"
          }`}
        >
          {/* 背景图 + 压暗层 */}
          <div
            className="absolute inset-0 -z-10 bg-[#0f172a]"
            style={
              bannerImage
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url(${bannerImage})`,
                    backgroundPosition: "center 60%",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                  }
                : undefined
            }
          />

          {isHomePage ? (
            <div className="flex w-full max-w-(--vhastro-max-width) flex-col items-center justify-center gap-[0.88rem] px-4">
              <div className="vhastro-avatar-spin h-[8.5rem] w-[8.5rem] shrink-0 overflow-hidden rounded-full border-2 border-white max-lg:h-[6rem] max-lg:w-[6rem]">
                <img
                  src={theme.avatar}
                  alt={siteConfig.author}
                  className="h-full w-full object-cover"
                />
              </div>

              <h3 className="pt-[1.88rem] text-center text-[1.88rem] font-semibold text-white max-lg:pt-0 max-md:text-[1.5rem]">
                {bannerTitle}
              </h3>

              <TypewriterLine
                text={siteConfig.description}
                className="vhastro-typewriter-cursor"
              />
            </div>
          ) : (
            <div className="w-full max-w-(--vhastro-max-width) px-4 text-center">
              <h1 className="text-[2.1rem] font-bold text-white [text-shadow:2px_2px_4px_rgba(0,0,0,0.3)] max-md:text-[1.6rem]">
                {bannerTitle}
              </h1>
            </div>
          )}
        </section>

        {/* ── 主体：row-reverse → 侧栏在左、正文在右 ── */}
        <section className="flex w-full max-w-(--vhastro-max-width) flex-row-reverse items-start max-[888px]:flex-col">
          <section className="min-w-0 flex-1 px-[0.66rem] py-[0.88rem] max-md:px-2">
            {children}
          </section>

          <aside className="w-(--vhastro-aside-width) shrink-0 px-[0.66rem] py-[0.88rem] max-[888px]:w-full">
            {isPostPage && (
              <div
                id="vhastro-aside-slot"
                className="mb-[1rem] empty:hidden empty:mb-0"
              />
            )}
            <Sidebar />
          </aside>
        </section>
      </main>

      <Footer />

      <BackToTop />
    </div>
  );
}

/**
 * 打字机简介（对应源主题 MainHeader 的 TypeWriteList + 闪动光标）
 * 逐字显示站点描述，末尾保留 `|` 光标。
 */
function TypewriterLine({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!text) return;
    let index = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const delay = setTimeout(() => {
      timer = setInterval(() => {
        index += 1;
        setShown(text.slice(0, index));
        if (index >= text.length && timer) clearInterval(timer);
      }, 60);
    }, 400);

    return () => {
      clearTimeout(delay);
      if (timer) clearInterval(timer);
    };
  }, [text]);

  return (
    <p
      className={`relative mt-[0.66rem] w-full max-w-[28.88rem] pt-[0.66rem] text-center text-[0.88rem] leading-6 text-white ${className ?? ""}`}
    >
      {/* 顶部分隔线：源主题 .desc::before 渐变线 */}
      <span className="absolute left-0 top-0 block h-px w-full opacity-50 [background:linear-gradient(90deg,rgba(0,0,0,0.7),#fff_35%,#fff_65%,rgba(0,0,0,0.7))]" />
      {shown}
    </p>
  );
}
