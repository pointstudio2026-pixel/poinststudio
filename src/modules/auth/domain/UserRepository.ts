import type { AdminTier, UserRole } from "@/shared/auth/jwt";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
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
