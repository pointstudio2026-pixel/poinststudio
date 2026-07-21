import { z } from "zod";

// 06_PRD_Authentication.md Validation Rules: min 8 chars, at least one
// letter and one number.
const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .regex(/[A-Za-z]/, "비밀번호는 영문자를 포함해야 합니다.")
  .regex(/\d/, "비밀번호는 숫자를 포함해야 합니다.");

export const registerSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: passwordSchema,
  name: z.string().min(1).max(120).optional(),
  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, { message: "이용약관 및 개인정보처리방침에 동의해야 가입할 수 있습니다." }),
});

export const oauthConsentSchema = z.object({
  agreedToTerms: z
    .boolean()
    .refine((v) => v === true, { message: "이용약관 및 개인정보처리방침에 동의해야 가입할 수 있습니다." }),
});

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").max(120),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type OAuthConsentInput = z.infer<typeof oauthConsentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
