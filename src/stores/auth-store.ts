import { create } from "zustand";
import type { PublicUser } from "@/services/auth-service";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  setUser: (user: PublicUser) => void;
  setLoading: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  setUser: (user) => set({ user, status: "authenticated" }),
  setLoading: () => set({ status: "loading" }),
  clear: () => set({ user: null, status: "unauthenticated" }),
}));
