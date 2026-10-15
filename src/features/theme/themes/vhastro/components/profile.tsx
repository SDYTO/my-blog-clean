import { Link, useRouteContext } from "@tanstack/react-router";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteConfig } from "@/features/config/site-config.schema";
import {
  resolveSocialHref,
  SOCIAL_PLATFORMS,
} from "@/features/config/utils/social-platforms";
import { m } from "@/paraglide/messages";
import { Stats } from "./stats";

/**
 * vhAstro 侧栏作者卡
 * 对应源主题 Aside.less 的 `.vh-aside-item.user`：
 *   方形圆角头像（1rem）+ 作者名（下方主色短横线）+ 座右铭 + 站点链接 + 统计
 */
export function Profile() {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  return (
    <div className="vhastro-aside-item py-[1.88rem]">
      <Link
        to="/"
        aria-label={m.profile_avatar_label()}
        className="block h-[6.36rem] w-[6.36rem] overflow-hidden rounded-[1rem] border border-(--vhastro-font-16)"
      >
        <img
          src={siteConfig.theme.vhastro.avatar}
          alt={siteConfig.author}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>

      {/* 作者名 + 主色下划线 */}
      <span className="relative text-[1.25rem] font-semibold vhastro-text-90">
        {siteConfig.author}
        <span className="absolute -bottom-[0.16rem] left-1/2 block h-[0.26rem] w-[36%] -translate-x-1/2 rounded-[3px] bg-(--vhastro-primary-88)" />
      </span>

      <p className="text-center text-[0.86rem] leading-relaxed vhastro-text-75">
        {siteConfig.description}
      </p>

      {siteConfig.social.filter(
        (l: SiteConfig["social"][number]) => l.url,
      ).length > 0 && (
        <section className="flex items-center gap-[0.5rem]">
          {siteConfig.social
            .filter((link: SiteConfig["social"][number]) => link.url)
            .map((link: SiteConfig["social"][number], i: number) => {
              const preset =
                link.platform !== "custom"
                  ? SOCIAL_PLATFORMS[link.platform]
                  : null;
              const Icon = preset?.icon;
              const label = preset?.label ?? link.label ?? "";
              const href = resolveSocialHref(link.platform, link.url);

              return (
                <a
                  key={`${link.platform}-${i}`}
                  href={href}
                  target={link.platform === "email" ? undefined : "_blank"}
                  rel={link.platform === "email" ? undefined : "me noreferrer"}
                  aria-label={label}
                  title={label}
                  className="group relative flex h-[1.88rem] w-[1.88rem] items-center justify-center overflow-hidden rounded-[0.38rem] border border-(--vhastro-font-28) transition-colors hover:border-(--vhastro-primary)"
                >
                  {/* 由下向上填充的主色底（源主题 .vh-aside-links-item::after） */}
                  <span className="absolute bottom-0 left-0 z-0 h-0 w-full bg-(--vhastro-primary-88) transition-[height] duration-200 ease-in-out group-hover:h-full" />
                  {Icon ? (
                    <span className="relative z-1 flex items-center justify-center vhastro-text-90 transition-colors group-hover:text-white">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                  ) : (
                    <img
                      src={link.icon}
                      alt={label}
                      className="relative z-1 h-[1.18rem] w-auto"
                    />
                  )}
                </a>
              );
            })}
        </section>
      )}

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid w-full grid-cols-2 gap-2 px-[0.5rem]">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-[3.6rem] rounded-(--vhastro-radius-large)" />
      ))}
    </div>
  );
}
