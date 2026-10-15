import type { SiteConfig } from "@/features/config/site-config.schema";

export const blogConfig = {
  title: "Home",
  author: "作者",
  description:
    "这是我的个人网站和博客。在这里，我主要分享与技术和生活相关的内容。欢迎阅读！",
  social: [
    { platform: "github", url: "https://github.com/example" },
    { platform: "email", url: "mailto:example@email.com" },
    { platform: "rss", url: "/rss.xml" },
  ],
  icons: {
    faviconSvg: "/favicon.svg",
    faviconIco: "/favicon.ico",
    favicon96: "/favicon-96x96.png",
    appleTouchIcon: "/apple-touch-icon.png",
    webApp192: "/web-app-manifest-192x192.png",
    webApp512: "/web-app-manifest-512x512.png",
  },
  theme: {
    default: {
      navBarName: "导航栏名称",
    },
    fuwari: {
      homeBg: "/images/home-bg.webp",
      avatar: "/images/avatar.png",
      primaryHue: 250,
    },
    butterfly: {
      // 首页第一屏大图
      homeBg: "/images/home-bg.webp",
      // 内页横幅图（留空则回退到 homeBg）
      pageBg: "",
      // 侧边栏 / 移动端抽屉头像
      avatar: "/images/avatar.png",
      // 主题主色
      primaryColor: "#1c69ed",
    },
    vhastro: {
      // 首页首屏（MainHeader）背景图
      homeBg: "/images/home-bg.webp",
      // 内页横幅图（留空则回退到 homeBg）
      pageBg: "",
      // 首屏与侧栏头像
      avatar: "/images/avatar.png",
      // 主题主色（源自 vhAstro-Theme 的 --vh-main-color）
      primaryColor: "#01c4b6",
      // 字体基础色（--vh-font-color）
      fontColor: "#34495e",
      // 侧栏宽度（--vh-aside-width）
      asideWidth: "318px",
      // 全局圆角（--vh-main-radius）
      radius: "1rem",
      // 内容区最大宽度（--vh-main-max-width）
      maxWidth: "1458px",
    },
  },
} as const satisfies SiteConfig;
