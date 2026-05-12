import { useAuthStore } from '../store/authStore';
import { refreshAccessToken } from './authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  const token = useAuthStore.getState().accessToken;
  return token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let token = await getToken();

  const makeRequest = async (t: string | null): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let res = await makeRequest(token);

  if (res.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      useAuthStore.getState().setAuth(token, useAuthStore.getState().user!);
      res = await makeRequest(token);
    }
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Request failed' }))) as { error?: string };
    throw Object.assign(new Error(err.error ?? `HTTP ${res.status}`), { status: res.status });
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}
