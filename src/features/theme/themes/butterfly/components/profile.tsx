import { Link, useRouteContext } from "@tanstack/react-router";
import type { SiteConfig } from "@/features/config/site-config.schema";
import {
  resolveSocialHref,
  SOCIAL_PLATFORMS,
} from "@/features/config/utils/social-platforms";
import { m } from "@/paraglide/messages";

/**
 * Butterfly 侧边栏作者卡（对应源主题 .aside-user）
 */
export function Profile() {
  const { siteConfig } = useRouteContext({ from: "__root__" });

  return (
    <div className="butterfly-card-base px-[23px] py-[16px] text-center">
      <Link
        to="/"
        aria-label={m.profile_avatar_label()}
        className="group mx-auto block w-fit"
      >
        <img
          src={siteConfig.theme.butterfly.avatar}
          alt={siteConfig.author}
          className="h-[110px] w-[110px] rounded-full object-cover transition-transform duration-500 group-hover:rotate-[360deg] group-hover:brightness-110"
        />
      </Link>

      <div className="mt-1.5 text-[1.4rem] font-bold leading-snug butterfly-text-90">
        {siteConfig.author}
      </div>

      <p className="mt-1 line-clamp-3 text-sm leading-relaxed butterfly-text-50">
        {siteConfig.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {siteConfig.social
          .filter((link: SiteConfig["social"][number]) => link.url)
          .map((link: SiteConfig["social"][number], i: number) => {
            const preset =
              link.platform !== "custom" ? SOCIAL_PLATFORMS[link.platform] : null;
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
                className="text-[1.35rem] leading-none text-(--butterfly-primary) transition-transform hover:scale-110"
              >
                {Icon ? (
                  <Icon size={20} strokeWidth={1.6} />
                ) : (
                  <img src={link.icon} alt={label} className="h-5 w-5" />
                )}
              </a>
            );
          })}
      </div>
    </div>
  );
}
