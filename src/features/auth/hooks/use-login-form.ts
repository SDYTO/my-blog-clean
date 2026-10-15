import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AUTH_KEYS } from "@/features/auth/queries";
import type { UseChallengeReturn } from "@/features/challenge/hooks/use-challenge";
import type { LoginStep } from "@/features/theme/contract/pages";
import { usePreviousLocation } from "@/hooks/use-previous-location";
import { authClient } from "@/lib/auth/auth.client";
import { getLoginAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { m } from "@/paraglide/messages";
import { normalizeRedirectUrl } from "./normalize-redirect-url";

const createLoginSchema = (messages: Messages) =>
  z.object({
    email: z.email(messages.login_validation_invalid_email()),
    password: z.string().min(1, messages.login_validation_password_required()),
  });

type LoginSchema = z.infer<ReturnType<typeof createLoginSchema>>;

export interface UseLoginFormOptions {
  challenge: UseChallengeReturn;
  redirectTo?: string;
}

/**
 * 本地账户登录：邮箱 + 密码一次提交，服务端直接校验凭据并签发会话。
 * 不再需要邮箱验证码（验证码路径仍由服务端保留兼容，见 auth.server.ts）。
 * 人机验证未通过时禁止提交，并把验证凭证随请求头带给服务端二次校验。
 */
export function useLoginForm(options: UseLoginFormOptions) {
  const { challenge, redirectTo } = options;

  const [loginStep, setLoginStep] = useState<LoginStep>("IDLE");

  const navigate = useNavigate();
  const previousLocation = usePreviousLocation();
  const queryClient = useQueryClient();
  const loginSchema = createLoginSchema(m);

  const form = useForm<LoginSchema>({
    resolver: standardSchemaResolver(loginSchema),
  });

  const performRedirect = (
    redirectTarget: string | undefined,
    fallback: string,
  ) => {
    const target = normalizeRedirectUrl(redirectTarget, fallback);

    if (target.startsWith("/api/")) {
      window.location.assign(target);
      return;
    }

    if (target.startsWith(window.location.origin)) {
      const url = new URL(target);
      navigate({ to: `${url.pathname}${url.search}${url.hash}` });
      return;
    }

    window.location.assign(target);
  };

  const handleLocalLogin = async (data: LoginSchema): Promise<void> => {
    if (challenge.isPending) {
      toast.error(m.challenge_pending_hint());
      return;
    }

    setLoginStep("VERIFYING");

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      fetchOptions: {
        headers: {
          "X-Turnstile-Token": challenge.token || "",
          "X-Altcha-Solution": challenge.altchaSolution || "",
        },
      },
    });

    if (error) {
      setLoginStep("IDLE");
      challenge.reset();
      toast.error(m.login_error_default(), {
        description:
          getLoginAuthErrorMessage(error, m) ?? m.auth_error_default_desc(),
      });
      return;
    }

    challenge.reset();
    queryClient.removeQueries({ queryKey: AUTH_KEYS.session });
    setLoginStep("SUCCESS");

    setTimeout(() => {
      performRedirect(redirectTo, previousLocation);
      toast.success(m.login_toast_success());
    }, 800);
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(handleLocalLogin),
    loginStep,
    isSubmitting: form.formState.isSubmitting,
    loginSchema,
    /** 人机验证未通过时为 true，用于禁用提交按钮 */
    challengePending: challenge.isPending,
  };
}

export type UseLoginFormReturn = ReturnType<typeof useLoginForm>;
