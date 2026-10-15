import { ClientOnly, useRouteContext } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

/**
 * Butterfly 页脚（居中版权 / 订阅 / 驱动信息）
 */
export function Footer() {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const currentYear = new Date().getFullYear();

  const linkClass =
    "rounded-md px-1 font-medium text-(--butterfly-primary) transition-colors hover:text-(--butterfly-primary-hover)";

  return (
    <footer className="footer mt-auto w-full pb-10 pt-4 text-center">
      <div className="mx-auto max-w-[1250px] px-[15px]">
        <div className="border-t border-dashed border-black/10 pt-8 text-sm butterfly-text-50 dark:border-white/15">
          <div>
            <ClientOnly fallback="-">
              {m.footer_copyright({
                year: currentYear.toString(),
                author: siteConfig.author,
              })}
            </ClientOnly>
          </div>
          <div className="mt-1.5">
            <a href="/rss.xml" target="_blank" rel="noreferrer" className={linkClass}>
              RSS
            </a>
            <span className="px-1 opacity-40">|</span>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className={linkClass}>
              Sitemap
            </a>
          </div>
          <div className="mt-1.5">
            {m.footer_powered_by()}{" "}
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Tanstack Start
            </a>
            <span className="px-1 opacity-40">&</span>
            <a
              href="https://github.com/cxyqiyue/demo-flare-blog"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Demo Flare Blog
            </a>
            <span className="px-1 opacity-40">|</span>
            <span>Theme by </span>
            <a
              href="https://github.com/dhjddcn/halo-theme-butterfly"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Butterfly
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
