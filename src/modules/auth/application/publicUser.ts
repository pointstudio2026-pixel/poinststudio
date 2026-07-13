import type { AuthUser } from "@/modules/auth/domain/UserRepository";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: AuthUser["role"];
  createdAt: Date;
}

export function toPublicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}
