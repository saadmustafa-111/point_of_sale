import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'ADMIN';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'pos-auth' }
  )
);
