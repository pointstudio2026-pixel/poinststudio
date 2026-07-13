import type { UserRole } from "@/shared/auth/jwt";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(input: CreateUserInput): Promise<AuthUser>;
}
