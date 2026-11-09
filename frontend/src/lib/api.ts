import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { STORAGE_KEYS } from "./constants";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/* ── Token helpers (client-only) ────────────────────────────── */

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.access);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.refresh);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(STORAGE_KEYS.access, access);
  if (refresh) localStorage.setItem(STORAGE_KEYS.refresh, refresh);
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
  localStorage.removeItem(STORAGE_KEYS.user);
}

/* ── Interceptors: attach access token, auto-refresh on 401 ─── */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
  setTokens(data.access, data.refresh);
  return data.access as string;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const isAuthCall = original?.url?.includes("/auth/");

    if (error.response?.status === 401 && !original._retried && !isAuthCall && getRefreshToken()) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const access = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        clearTokens();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("skiwaa:logout"));
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

/** Pull a human-readable message out of a DRF error envelope. */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string } | undefined;
    if (data?.detail) return data.detail;
    if (error.code === "ECONNABORTED") return "The request timed out. Try again.";
    if (!error.response) return "Cannot reach the server. Check your connection.";
  }
  return fallback;
}
