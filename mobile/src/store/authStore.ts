import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avgRating: number | null;
  completedTransactionCount: number;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ isAuthenticated: true, accessToken, user }),
  clearAuth: () => set({ isAuthenticated: false, accessToken: null, user: null }),
}));
