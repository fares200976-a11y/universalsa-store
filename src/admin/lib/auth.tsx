import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Session {
  token: string;
  role: string;
  username: string;
}

const STORAGE_KEY = "admin_session";

export type Permission = "catalog" | "cms" | "staff";

/** Map the (possibly legacy) stored role onto a canonical tier. */
export function normalizeRole(role: string): "super_admin" | "admin" | "employe" {
  if (role === "super_admin") return "super_admin";
  if (role === "admin" || role === "gérant") return "admin";
  return "employe";
}

export function roleLabel(role: string): string {
  switch (normalizeRole(role)) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    default:
      return "Employé";
  }
}

/**
 * Permission tiers mirror the server guards:
 * - catalog (orders, products, cars, settings): every authenticated role.
 * - cms (pages, brands, categories, models, customers, media, appearance): admin + super.
 * - staff (user & role management): super admin only.
 */
export function roleCan(role: string, perm: Permission): boolean {
  const tier = normalizeRole(role);
  switch (perm) {
    case "catalog":
      return true;
    case "cms":
      return tier === "admin" || tier === "super_admin";
    case "staff":
      return tier === "super_admin";
  }
}

interface AuthContextValue {
  session: Session;
  token: string;
  role: string;
  username: string;
  logout: () => void;
  can: (perm: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed?.token && parsed?.role && parsed?.username) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function storeSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({
  session,
  onLogout,
  children,
}: {
  session: Session;
  onLogout: () => void;
  children: ReactNode;
}) {
  const can = useCallback((perm: Permission) => roleCan(session.role, perm), [session.role]);
  const value: AuthContextValue = {
    session,
    token: session.token,
    role: session.role,
    username: session.username,
    logout: onLogout,
    can,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Standalone login screen state helper kept here so all auth lives together. */
export function useSessionState() {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const login = useCallback((s: Session) => {
    storeSession(s);
    setSession(s);
  }, []);
  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);
  return { session, login, logout };
}
