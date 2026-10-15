import { useSuspenseQuery } from "@tanstack/react-query";
import { publicPostsPageQuery } from "@/features/posts/queries";
import { tagsQueryOptions } from "@/features/tags/queries";
import { m } from "@/paraglide/messages";

/**
 * 侧栏统计卡（源主题 .vh-aside-info 的 3 列计数，
 * 本项目无「分类」概念，故展示文章数 / 标签数两列）
 */
export function Stats() {
  const { data: page } = useSuspenseQuery(
    publicPostsPageQuery({ offset: 0, limit: 1 }),
  );
  const { data: tags } = useSuspenseQuery(tagsQueryOptions);

  const items = [
    { key: "posts", value: page.total, label: m.sidebar_stats_posts_vhastro() },
    { key: "tags", value: tags.length, label: m.sidebar_stats_tags_vhastro() },
  ];

  return (
    <section className="grid w-full grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="flex flex-col items-center justify-center gap-[0.28rem] rounded-(--vhastro-radius-large) py-[0.88rem] transition-shadow duration-200 hover:shadow-[var(--vhastro-card-shadow)]"
        >
          <span className="text-[1.05rem] font-medium vhastro-text-90">
            {item.value}
          </span>
          <p className="text-[0.8rem] vhastro-text-50">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
