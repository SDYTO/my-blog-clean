import type { FieldErrors, UseFormRegister } from "react-hook-form";

export type RegisterStep = "IDLE" | "VERIFYING" | "SUCCESS";

export interface RegisterSchema {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormData {
  register: UseFormRegister<RegisterSchema>;
  errors: FieldErrors<RegisterSchema>;
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isSuccess: boolean;
  registerStep: RegisterStep;
  /** 人机验证未通过时为 true（用于禁用提交按钮） */
  challengePending: boolean;
}

export interface RegisterPageProps {
  /** 是否已配置邮件服务：仅影响提示文案，本地账户创建始终可用 */
  isEmailConfigured: boolean;
  registerForm: RegisterFormData;
  challengeElement: React.ReactNode;
}
