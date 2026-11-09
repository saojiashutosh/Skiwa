"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api, clearTokens, getAccessToken, setTokens } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/constants";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate: cached user first (instant paint), then verify with the API.
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.user);
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.user);
      }
    }
    if (!getAccessToken()) {
      setIsLoading(false);
      return;
    }
    api
      .get<User>("/profile/")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
      })
      .catch(() => {
        /* interceptor handles token refresh/logout */
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Global logout signal from the axios interceptor (refresh token died).
  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener("skiwaa:logout", onForcedLogout);
    return () => window.removeEventListener("skiwaa:logout", onForcedLogout);
  }, []);

  const persistSession = useCallback((data: { user: User; access: string; refresh: string }) => {
    setTokens(data.access, data.refresh);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
    setUser(data.user);
    window.dispatchEvent(new CustomEvent("skiwaa:login"));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post("/auth/login/", { email, password });
      persistSession(data);
      return data.user as User;
    },
    [persistSession],
  );

  const register = useCallback(
    async (payload: { email: string; password: string; first_name?: string; last_name?: string }) => {
      const { data } = await api.post("/auth/register/", payload);
      persistSession(data);
      return data.user as User;
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(STORAGE_KEYS.refresh);
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      /* already invalid — nothing to do */
    }
    clearTokens();
    setUser(null);
    router.push("/");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<User>("/profile/");
    setUser(data);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
