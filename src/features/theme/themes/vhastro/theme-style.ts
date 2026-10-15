import type { CSSProperties } from "react";
import type { SiteConfig } from "@/features/config/site-config.schema";

/**
 * 注入 vhAstro 主题基准令牌。
 *
 * 对应源主题 Layout.astro 写入 `:root` 的那组变量：
 *   --vh-main-color（主题色）/ --vh-font-color（字体色）
 *   / --vh-aside-width（侧栏宽度）/ --vh-main-radius（全局圆角）
 *   / --vh-main-max-width（主体宽度）
 *
 * 其余色阶（-88 / -66 / -16 …）在 styles/index.css 中通过 color-mix
 * 从这些基准值自动派生，浅色 / 暗色两套色板都会跟随联动。
 */
export function getVhastroThemeStyle(siteConfig: SiteConfig): CSSProperties {
  const theme = siteConfig.theme.vhastro;
  return {
    "--vhastro-theme": theme.primaryColor,
    "--vhastro-font-color": theme.fontColor,
    "--vhastro-aside-width": theme.asideWidth,
    "--vhastro-radius-large": theme.radius,
    "--vhastro-max-width": theme.maxWidth,
    "--vhastro-page-width": theme.maxWidth,
  } as CSSProperties;
}
