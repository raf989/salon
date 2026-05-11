"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AuthUser,
  Lang,
  ProviderKind,
  Role,
  UserRole,
} from "./types";
import { normalizePhone } from "./utils";

export type RegisterInput = {
  phone: string; // raw input, will be normalized
  name: string;
  password: string;
  role: UserRole;
  email?: string; // required when role === "provider"
  kind?: ProviderKind; // required when role === "provider"
};

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "phoneTaken" | "invalidPhone" };

export type VerifyOtpResult = { ok: true } | { ok: false };

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "notFound" | "wrongPassword" | "notVerified" };

type Store = {
  // UI prefs
  role: Role;
  setRole: (r: Role) => void;
  language: Lang;
  setLanguage: (l: Lang) => void;
  cityId: string;
  setCityId: (id: string) => void;

  // auth slice
  users: AuthUser[];
  sessionUserId: string | null;
  register: (input: RegisterInput) => RegisterResult;
  verifyOtp: (userId: string, code: string) => VerifyOtpResult;
  login: (phone: string, password: string) => LoginResult;
  logout: () => void;
  currentUser: () => AuthUser | null;
  updateCurrentUser: (patch: Partial<Pick<AuthUser, "name" | "email">>) => void;
};

function makeId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      role: "client",
      setRole: (r) => set({ role: r }),
      language: "az",
      setLanguage: (l) => set({ language: l }),
      cityId: "baku",
      setCityId: (id) => set({ cityId: id }),

      users: [],
      sessionUserId: null,

      register: (input) => {
        const phone = normalizePhone(input.phone);
        if (!phone) return { ok: false, reason: "invalidPhone" };
        const existing = get().users.find((u) => u.phone === phone);
        if (existing) return { ok: false, reason: "phoneTaken" };

        const user: AuthUser = {
          id: makeId(),
          phone,
          name: input.name.trim(),
          password: input.password,
          role: input.role,
          email: input.role === "provider" ? input.email?.trim() : undefined,
          kind: input.role === "provider" ? input.kind : undefined,
          verified: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ users: [...state.users, user] }));
        return { ok: true, userId: user.id };
      },

      verifyOtp: (userId, code) => {
        if (code !== "123456") return { ok: false };
        const target = get().users.find((u) => u.id === userId);
        if (!target) return { ok: false };
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, verified: true } : u,
          ),
          sessionUserId: userId,
        }));
        return { ok: true };
      },

      login: (phoneRaw, password) => {
        const phone = normalizePhone(phoneRaw);
        const user = phone
          ? get().users.find((u) => u.phone === phone)
          : undefined;
        if (!user) return { ok: false, reason: "notFound" };
        if (user.password !== password)
          return { ok: false, reason: "wrongPassword" };
        if (!user.verified) return { ok: false, reason: "notVerified" };
        set({ sessionUserId: user.id });
        return { ok: true, userId: user.id };
      },

      logout: () => set({ sessionUserId: null }),

      currentUser: () => {
        const state = get();
        return (
          state.users.find((u) => u.id === state.sessionUserId) ?? null
        );
      },

      updateCurrentUser: (patch) =>
        set((state) => {
          if (!state.sessionUserId) return state;
          return {
            users: state.users.map((u) =>
              u.id === state.sessionUserId ? { ...u, ...patch } : u,
            ),
          };
        }),
    }),
    {
      name: "salon-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        language: state.language,
        cityId: state.cityId,
        users: state.users,
        sessionUserId: state.sessionUserId,
      }),
    },
  ),
);
