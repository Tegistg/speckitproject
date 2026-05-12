import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    avgRating: number | null;
    completedTransactionCount: number;
  };
}

export async function register(email: string, password: string, name: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? 'Registration failed');
  }
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? 'Login failed');
  }
  const data = (await res.json()) as AuthResponse;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh_token);
  useAuthStore.getState().setAuth(data.access_token, data.user);
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  useAuthStore.getState().clearAuth();
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    await logout();
    return null;
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string };
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refresh_token);
  return data.access_token;
}
