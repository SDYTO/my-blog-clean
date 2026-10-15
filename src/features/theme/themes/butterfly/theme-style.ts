import type { CSSProperties } from "react";
import type { SiteConfig } from "@/features/config/site-config.schema";

/**
 * 注入 Butterfly 主题主色。
 *
 * 只注入基准色 `--butterfly-theme`，其余色值（主色、悬浮色、按钮底色、
 * 选中色…）在 styles/index.css 中通过 color-mix 从基准色自动派生，
 * 因此浅色 / 暗色两套色板都能跟随自定义主色联动。
 */
export function getButterflyThemeStyle(siteConfig: SiteConfig): CSSProperties {
  return {
    "--butterfly-theme": siteConfig.theme.butterfly.primaryColor,
  } as CSSProperties;
}
