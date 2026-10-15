import type { SiteConfig } from "@/features/config/site-config.schema";

// if the theme doesn't have a preload image, return an empty array
export function getThemePreloadImages(siteConfig: SiteConfig): Array<string> {
  switch (__THEME_NAME__) {
    case "fuwari":
      return siteConfig.theme.fuwari.homeBg
        ? [siteConfig.theme.fuwari.homeBg]
        : [];
    case "butterfly":
      return [
        siteConfig.theme.butterfly.homeBg,
        siteConfig.theme.butterfly.pageBg,
      ].filter((image): image is string => Boolean(image));
    case "vhastro":
      return [
        siteConfig.theme.vhastro.homeBg,
        siteConfig.theme.vhastro.pageBg,
      ].filter((image): image is string => Boolean(image));
    case "default":
      return [
        siteConfig.theme.default.background?.homeImage,
        siteConfig.theme.default.background?.globalImage,
      ].filter((image): image is string => Boolean(image));
    default:
      __THEME_NAME__ satisfies never;
      return [];
  }
}
