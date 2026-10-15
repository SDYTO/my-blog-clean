import type { FieldErrors, UseFormRegister } from "react-hook-form";

export type LoginStep = "IDLE" | "VERIFYING" | "SUCCESS";

export interface LoginSchema {
  email: string;
  password: string;
}

export interface LoginFormData {
  register: UseFormRegister<LoginSchema>;
  errors: FieldErrors<LoginSchema>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  loginStep: LoginStep;
  isSubmitting: boolean;
  /** 人机验证未通过时为 true（用于禁用提交按钮） */
  challengePending: boolean;
}

export interface SocialLoginData {
  isLoading: boolean;
  /** 人机验证未通过时禁用登录按钮 */
  challengePending: boolean;
  handleGithubLogin: () => Promise<void>;
}

export interface LoginPageProps {
  /** 是否已配置邮件服务：仅决定「忘记密码」入口是否展示，本地账户登录始终可用 */
  isEmailConfigured: boolean;
  loginForm: LoginFormData;
  socialLogin: SocialLoginData;
  challengeElement: React.ReactNode;
}
