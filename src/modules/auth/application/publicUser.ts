import type { AuthUser } from "@/modules/auth/domain/UserRepository";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: AuthUser["role"];
  adminTier: AuthUser["adminTier"];
  createdAt: Date;
  /** OAuth 전용 계정은 passwordHash가 null -- 원본 해시는 절대 클라이언트에 내려주지 않고 이 플래그만 노출한다. */
  hasPassword: boolean;
  emailVerified: boolean;
}

export function toPublicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    adminTier: user.adminTier,
    createdAt: user.createdAt,
    hasPassword: user.passwordHash !== null,
    emailVerified: user.emailVerifiedAt !== null,
  };
}
