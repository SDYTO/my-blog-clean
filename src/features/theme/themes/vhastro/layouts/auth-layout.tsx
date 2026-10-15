import { ArrowLeft } from "lucide-react";
import type { AuthLayoutProps } from "@/features/theme/contract/layouts";
import { m } from "@/paraglide/messages";

export function AuthLayout({ onBack, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-(--vhastro-page-bg) text-(--vhastro-text-75) flex flex-col items-center justify-center p-4">
      {/* Background decoration (optional but adds to the theme) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--vhastro-primary) opacity-[0.03] rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-(--vhastro-primary) opacity-[0.03] rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 vhastro-onload-animation">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="group absolute -top-14 left-0 flex items-center justify-center w-10 h-10 rounded-xl bg-(--vhastro-card-bg) shadow-sm text-(--vhastro-text-50) hover:text-(--vhastro-text-90) hover:shadow-md transition-all shrink-0"
          title={m.auth_layout_back_home()}
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
        </button>

        {/* Auth Card Container */}
        <div className="vhastro-card-base p-8 md:p-10 w-full shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
