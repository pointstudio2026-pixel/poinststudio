import type { AdminTier, UserRole } from "@/shared/auth/jwt";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  birthDate: Date | null;
  role: UserRole;
  adminTier: AdminTier | null;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  suspendedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  /** Omitted for OAuth-only sign-ups (Google/Kakao) -- they never set a password. */
  passwordHash?: string;
  name?: string;
  /** 2026-07-25부터 구글/카카오 회원가입 동의 화면에서 함께 입력받는다(OAuth 프로필엔 없는 정보). 비밀번호 가입은 아직 수집하지 않는다. */
  birthDate?: Date;
  /** Set when the identity is already verified by an OAuth provider (e.g. Google). */
  emailVerifiedAt?: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(input: CreateUserInput): Promise<AuthUser>;
  updateProfile(id: string, input: { name: string }): Promise<AuthUser>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  setEmailVerificationToken(id: string, token: string, expiresAt: Date): Promise<void>;
  findByEmailVerificationToken(token: string): Promise<AuthUser | null>;
  /** Sets emailVerifiedAt to now and clears the token fields (consumed, one-time use). */
  markEmailVerified(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
}
