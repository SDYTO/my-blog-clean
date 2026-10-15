import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AUTH_KEYS } from "@/features/auth/queries";
import type { UseChallengeReturn } from "@/features/challenge/hooks/use-challenge";
import type { RegisterStep } from "@/features/theme/contract/pages";
import { usePreviousLocation } from "@/hooks/use-previous-location";
import { authClient } from "@/lib/auth/auth.client";
import { getRegisterAuthErrorMessage } from "@/lib/auth/auth-errors";
import type { Messages } from "@/lib/i18n";
import { m } from "@/paraglide/messages";

const createRegisterSchema = (messages: Messages) =>
  z
    .object({
      name: z
        .string()
        .min(2, messages.register_validation_name_min())
        .max(20, messages.register_validation_name_max()),
      email: z.email(messages.register_validation_email_invalid()),
      password: z.string().min(8, messages.register_validation_password_min()),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.register_validation_password_mismatch(),
      path: ["confirmPassword"],
    });

type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;

export interface UseRegisterFormOptions {
  challenge: UseChallengeReturn;
}

/**
 * 本地账户创建：邮箱 + 密码 + 昵称一次提交，服务端直接建号并自动登录。
 * 不再需要邮箱验证码；人机验证未通过时禁止提交。
 */
export function useRegisterForm(options: UseRegisterFormOptions) {
  const { challenge } = options;

  const [step, setStep] = useState<RegisterStep>("IDLE");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const previousLocation = usePreviousLocation();
  const queryClient = useQueryClient();
  const registerSchema = createRegisterSchema(m);

  const form = useForm<RegisterSchema>({
    resolver: standardSchemaResolver(registerSchema),
  });

  const handleLocalRegister = async (data: RegisterSchema): Promise<void> => {
    if (challenge.isPending) {
      toast.error(m.challenge_pending_hint());
      return;
    }

    setStep("VERIFYING");

    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      fetchOptions: {
        headers: {
          "X-Turnstile-Token": challenge.token || "",
          "X-Altcha-Solution": challenge.altchaSolution || "",
        },
      },
    });

    if (error) {
      setStep("IDLE");
      challenge.reset();
      toast.error(m.register_toast_failed(), {
        description:
          getRegisterAuthErrorMessage(error, m) ?? m.register_error_default(),
      });
      return;
    }

    challenge.reset();
    queryClient.removeQueries({ queryKey: AUTH_KEYS.session });
    setIsSuccess(true);
    setStep("SUCCESS");

    setTimeout(() => {
      toast.success(m.register_toast_success(), {
        description: m.register_toast_created(),
      });
      navigate({ to: previousLocation });
    }, 800);
  };

  return {
    register: form.register,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit(handleLocalRegister),
    isSubmitting: form.formState.isSubmitting,
    isSuccess,
    registerStep: step,
    /** 人机验证未通过时为 true，用于禁用提交按钮 */
    challengePending: challenge.isPending,
  };
}

export type UseRegisterFormReturn = ReturnType<typeof useRegisterForm>;
