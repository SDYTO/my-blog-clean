import type { ThemeConfig } from "@/features/theme/contract/config";

export const config: ThemeConfig = {
  home: {
    // 三列网格，取 3 的倍数让每页刚好铺满
    postsPerPage: 9,
    popularPostsLimit: 3,
  },
  posts: {
    postsPerPage: 24,
  },
  post: {
    relatedPostsLimit: 4,
  },
};
