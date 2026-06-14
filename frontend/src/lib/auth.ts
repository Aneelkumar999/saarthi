import type { AuthUser } from "@/lib/api";

const TOKEN_KEY = "saarthi_access_token";
const REFRESH_KEY = "saarthi_refresh_token";
const USER_KEY = "saarthi_user";
const LOGIN_MODE_KEY = "saarthi_login_mode";

export type LoginMode = "citizen" | "admin";

export function saveAuth(token: string, user: AuthUser, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function setLoginMode(mode: LoginMode) {
  localStorage.setItem(LOGIN_MODE_KEY, mode);
}

export function getLoginMode(): LoginMode {
  if (typeof window === "undefined") return "citizen";
  return (localStorage.getItem(LOGIN_MODE_KEY) as LoginMode) || "citizen";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function isAdmin(): boolean {
  const user = getStoredUser();
  if (!user) return false;
  return (user as Record<string, unknown>).role === "admin";
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOGIN_MODE_KEY);
}
