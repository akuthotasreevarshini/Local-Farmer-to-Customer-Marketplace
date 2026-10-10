import { create } from 'zustand';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'farmer' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),

  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  setToken: (accessToken) =>
    set({ accessToken }),
}));
