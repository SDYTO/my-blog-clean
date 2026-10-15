import { ClientOnly, useRouteContext } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

/**
 * vhAstro 页脚
 * 对应源主题 src/components/Footer/Footer.less：
 *   padding 2.6rem 0、半透明白底 + 背景模糊、内容居中。
 */
export function Footer() {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const currentYear = new Date().getFullYear();

  const linkClass =
    "rounded-sm px-1 font-medium text-(--vhastro-primary) transition-opacity hover:opacity-80";

  return (
    <footer className="vh-footer mt-[1.68rem] flex w-full items-center justify-center bg-white/40 py-[2.6rem] backdrop-blur-[2px] backdrop-saturate-100 dark:bg-white/5">
      <div className="mx-auto flex w-full max-w-(--vhastro-max-width) flex-col gap-[0.618rem] px-[0.88rem] text-center text-[0.88rem] vhastro-text-50">
        <p className="leading-none">
          <ClientOnly fallback="-">
            {m.footer_copyright({
              year: currentYear.toString(),
              author: siteConfig.author,
            })}
          </ClientOnly>
        </p>

        <p className="flex flex-wrap items-center justify-center gap-[0.618rem] leading-none">
          <a href="/rss.xml" target="_blank" rel="noreferrer" className={linkClass}>
            RSS
          </a>
          <span className="opacity-30">|</span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Sitemap
          </a>
        </p>

        <p className="flex flex-wrap items-center justify-center gap-[0.618rem] leading-none">
          {m.footer_powered_by()}{" "}
          <a
            href="https://tanstack.com/start"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            TanStack Start
          </a>
          <span className="opacity-30">&</span>
          <a
            href="https://github.com/cxyqiyue/demo-flare-blog"
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            Demo Flare Blog
          </a>
          <span className="opacity-30">|</span>
          <span>
            Theme by{" "}
            <a
              href="https://github.com/uxiaohan/vhAstro-Theme"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              vhAstro
            </a>
          </span>
        </p>
      </div>
    </footer>
  );
}
