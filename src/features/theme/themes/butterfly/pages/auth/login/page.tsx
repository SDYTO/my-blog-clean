import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { GithubIcon } from "@/components/common/brand-icon";
import type { LoginPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

export function LoginPage({
  isEmailConfigured,
  loginForm,
  socialLogin,
  challengeElement,
}: LoginPageProps) {
  const {
    register,
    errors,
    handleSubmit,
    loginStep,
    isSubmitting,
    challengePending,
  } = loginForm;

  const {
    isLoading: socialIsLoading,
    challengePending: socialChallengePending,
    handleGithubLogin,
  } = socialLogin;

  const isIdle = loginStep === "IDLE";
  const isBusy = isSubmitting || loginStep === "VERIFYING";
  const isSocialDisabled = socialIsLoading || socialChallengePending;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold butterfly-text-90">
          {m.login_title()}
        </h1>
        <p className="text-sm font-medium butterfly-text-50">
          {m.login_welcome_back()}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Local account (email + password) login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 focus-within:text-(--butterfly-primary) transition-colors text-(--butterfly-text-50)">
            <label htmlFor="login-email" className="text-sm font-bold ml-1">
              {m.login_email_address()}
            </label>
            <input
              id="login-email"
              type="email"
              {...register("email")}
              placeholder={m.login_email_placeholder()}
              autoComplete="username"
              disabled={isBusy}
              className="w-full bg-(--butterfly-input-bg) border border-(--butterfly-input-border) rounded-xl px-4 py-3 text-(--butterfly-text-90) placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-(--butterfly-primary)/50 focus:bg-(--butterfly-primary)/5 transition-all text-sm outline-none"
            />
            {errors.email && (
              <span className="text-xs text-red-500 ml-1 mt-1 font-medium">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 focus-within:text-(--butterfly-primary) transition-colors text-(--butterfly-text-50)">
            <div className="flex justify-between items-center ml-1">
              <label htmlFor="login-password" className="text-sm font-bold">
                {m.login_password()}
              </label>
              {isEmailConfigured && (
                <Link
                  to="/forgot-password"
                  tabIndex={-1}
                  className="text-xs font-medium hover:text-(--butterfly-primary) transition-colors"
                >
                  {m.login_forgot_password_butterfly()}
                </Link>
              )}
            </div>
            <input
              id="login-password"
              type="password"
              {...register("password")}
              placeholder={m.login_password_placeholder()}
              autoComplete="current-password"
              disabled={isBusy}
              className="w-full bg-(--butterfly-input-bg) border border-(--butterfly-input-border) rounded-xl px-4 py-3 text-(--butterfly-text-90) placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-(--butterfly-primary)/50 focus:bg-(--butterfly-primary)/5 transition-all text-sm outline-none"
            />
            {errors.password && (
              <span className="text-xs text-red-500 ml-1 mt-1 font-medium">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isBusy || challengePending}
            className="mt-2 w-full py-3.5 rounded-xl butterfly-btn-primary font-bold text-sm tracking-wide active:scale-[0.98] transition-all gap-2 disabled:opacity-50 disabled:active:scale-100"
          >
            {isBusy ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>{m.login_submitting()}</span>
              </>
            ) : (
              <span>{m.login_submit()}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        {isIdle && (
          <div className="relative flex items-center py-2">
            <div className="flex-1 border-t border-border/30"></div>
            <span className="mx-4 text-xs font-medium butterfly-text-30">
              {m.login_or()}
            </span>
            <div className="flex-1 border-t border-border/30"></div>
          </div>
        )}

        {/* Social Login */}
        {isIdle && (
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={isSocialDisabled}
            className="group w-full py-3.5 rounded-xl flex gap-3 transition-all font-bold text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 butterfly-btn-regular"
          >
            {socialIsLoading ? (
              <Loader2 size={16} className="animate-spin opacity-70" />
            ) : (
              <GithubIcon size={16} />
            )}

            <span className="tracking-wide">
              {socialIsLoading
                ? m.login_social_connecting()
                : m.login_github_butterfly()}
            </span>
          </button>
        )}

        {challengeElement}

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-sm font-medium butterfly-text-50">
            {m.login_no_account()}{" "}
            <Link
              to="/register"
              className="text-(--butterfly-primary) hover:underline"
            >
              {m.login_register_now()}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
