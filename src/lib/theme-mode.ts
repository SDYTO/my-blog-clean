/**
 * Compile-time theme flag. Vite folds this constant at build time
 * (see vite.config.ts `define.__THEME_NAME__`), so the dead branch is
 * tree-shaken away and the build never mixes theme class systems.
 */
export const isFuwari = __THEME_NAME__ === "fuwari";

/** 当前构建是否为 Butterfly 主题 */
export const isButterfly = __THEME_NAME__ === "butterfly";

/** 当前构建是否为 vhAstro 主题 */
export const isVhastro = __THEME_NAME__ === "vhastro";
