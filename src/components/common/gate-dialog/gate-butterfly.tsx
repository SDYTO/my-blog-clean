import { ArrowLeft, ExternalLink, Loader2, X } from "lucide-react";
import type React from "react";
import { m } from "@/paraglide/messages";
import type {
  AccessGateError,
  AccessGateMode,
} from "@/components/common/access-gate.types";

export interface GateContentProps {
  mode: AccessGateMode;
  title?: string;
  channel?: string | null;
  hint?: string | null;
  error?: AccessGateError | null;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  loginUrl?: string;
  password: string;
  setPassword: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
  onChannelOpen: () => void;
}

const eyebrowOf = (mode: AccessGateMode): string =>
  mode === "private"
    ? m.access_gate_eyebrow_private()
    : mode === "login"
      ? m.access_gate_eyebrow_login()
      : m.access_gate_eyebrow_password();

const descOf = (mode: AccessGateMode): string =>
  mode === "private"
    ? m.access_gate_desc_private()
    : mode === "login"
      ? m.access_gate_desc_login()
      : m.access_gate_desc_password();

const titleOf = (mode: AccessGateMode, title?: string): string =>
  title ||
  (mode === "private"
    ? m.access_gate_title_private()
    : mode === "login"
      ? m.access_gate_title_login()
      : m.access_gate_title_password());

const errorMessage: Record<AccessGateError, string> = {
  wrongPassword: m.access_gate_error_wrong_password(),
  rateLimited: m.access_gate_error_rate_limited(),
  locked: m.access_gate_error_locked_too_many(),
  invalidLink: m.access_gate_error_invalid_link(),
  generic: m.access_gate_error_generic(),
};

/**
 * Butterfly 主题的限制访问弹窗。
 *
 * 视觉对齐 halo-theme-butterfly 的卡片 / 圆角 / 主色体系：
 * 白底卡片 + 15px 大圆角 + 卡片阴影，主色按钮与主色描边输入框。
 */
export function ButterflyGateContent(props: GateContentProps) {
  const {
    mode,
    title,
    channel,
    hint,
    error,
    isSubmitting,
    isSuccess,
    loginUrl = "/login",
    password,
    setPassword,
    onSubmit,
    onClose,
    onChannelOpen,
  } = props;

  return (
    <div className="butterfly-card-base relative flex w-full max-w-md flex-col p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-(--butterfly-input-border) pb-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] butterfly-text-30">
            [ {eyebrowOf(mode)} ]
          </p>
          <h2 className="break-words text-lg font-bold butterfly-text-90">
            {titleOf(mode, title)}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="-mr-1 -mt-1 shrink-0 p-1 butterfly-text-50 transition-colors hover:text-(--butterfly-primary) disabled:opacity-50"
          aria-label={m.common_close()}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 pt-5">
        <p className="text-sm font-medium leading-relaxed butterfly-text-50">
          {descOf(mode)}
        </p>

        {mode === "password" ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {hint && hint.trim() !== "" && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-widest butterfly-text-30">
                  {m.access_gate_hint_label()}
                </p>
                <p className="whitespace-pre-wrap text-sm font-medium butterfly-text-50">
                  {hint}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="access-gate-password"
                className="text-sm font-bold butterfly-text-50"
              >
                {m.access_gate_input_label()}
              </label>
              <input
                id="access-gate-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={m.access_gate_input_placeholder()}
                autoComplete="off"
                autoFocus
                disabled={isSubmitting || isSuccess}
                className="w-full rounded-(--butterfly-radius-small) border border-(--butterfly-input-border) bg-(--butterfly-input-bg) px-4 py-3 text-sm text-(--butterfly-text-color) transition-all placeholder:text-black/30 focus:border-(--butterfly-primary) focus:outline-none disabled:opacity-50 dark:placeholder:text-white/30"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-red-500">
                {errorMessage[error]}
              </p>
            )}

            {channel && channel.trim() !== "" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-widest butterfly-text-30">
                  {m.access_gate_channel_tip()}
                </p>
                <button
                  type="button"
                  onClick={onChannelOpen}
                  className="butterfly-btn-regular flex w-full items-center justify-center gap-2 py-3 text-sm font-bold active:scale-[0.98]"
                >
                  <ExternalLink size={14} strokeWidth={2} />
                  <span>{m.access_gate_get_password_btn()}</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-(--butterfly-input-border) pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isSuccess}
                className="flex items-center gap-1.5 text-xs font-bold butterfly-text-50 transition-colors hover:text-(--butterfly-primary) disabled:opacity-50"
              >
                <ArrowLeft size={13} className="-ml-1" />
                <span>{m.access_gate_back_btn()}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isSuccess || !password.trim()}
                className="butterfly-btn-primary flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold active:scale-[0.98]"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>
                  {isSubmitting
                    ? m.common_processing()
                    : isSuccess
                      ? m.access_gate_password_success()
                      : m.access_gate_submit()}
                </span>
              </button>
            </div>
          </form>
        ) : mode === "login" ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium butterfly-text-50">
              {m.access_gate_login_hint()}
            </p>
            <a
              href={loginUrl}
              className="butterfly-btn-primary shrink-0 px-6 py-3 text-sm font-bold active:scale-[0.98]"
            >
              {m.access_gate_login_cta()}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
