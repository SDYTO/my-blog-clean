import { Link } from "@tanstack/react-router";
import { SiteInfoAndApplyRules } from "@/features/friend-links/components/site-info-and-apply-rules";
import type { FriendLinksPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { FriendCard } from "./components/friend-card";

export function FriendLinksPage({
  links,
  siteInfo,
  applyRules,
}: FriendLinksPageProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Banner representing the current page + 本站信息/申请须知/申请按钮 */}
      <div
        className="butterfly-card-base p-6 md:p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-56 butterfly-onload-animation bg-linear-to-br from-(--butterfly-primary)/5 to-transparent"
        style={{ animationDelay: "150ms" }}
      >
        <h1 className="text-3xl md:text-4xl font-bold butterfly-text-90 mb-4 z-10 transition-colors">
          {m.friend_links_title()}
        </h1>
        <p className="butterfly-text-50 text-center max-w-xl z-10 transition-colors">
          {m.friend_links_butterfly_desc()}
        </p>
        <Link
          to="/submit-friend-link"
          className="mt-6 z-10 butterfly-onload-animation butterfly-btn-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all"
        >
          {m.friend_links_butterfly_apply()}
        </Link>

        <div className="mt-8 w-full max-w-2xl flex flex-col gap-6 z-10">
          <SiteInfoAndApplyRules siteInfo={siteInfo} applyRules={applyRules} />
        </div>
      </div>

      {/* Links Grid */}
      <div
        className="butterfly-card-base p-6 md:p-8 butterfly-onload-animation flex-1"
        style={{ animationDelay: "300ms" }}
      >
        {links.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {links.map((link, i) => (
              <FriendCard
                key={link.id}
                link={link}
                className="butterfly-onload-animation"
                style={{ animationDelay: `${400 + i * 50}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 butterfly-text-30 transition-colors">
            <p className="text-lg">{m.friend_links_butterfly_no_links()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
