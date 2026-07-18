import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAccessToken, setRefreshFn, post } from "@/lib/api-client";

export type UserRole = "student" | "teacher" | "parent" | "school_admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  subtitle: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function makeInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Token refresh function — called by api-client on 401
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const data = await post<{ access_token: string }>("/auth/refresh", {});
      setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      setUser(null);
      setAccessToken(null);
      return null;
    }
  }, []);

  // Register the refresh function with the API client once
  useEffect(() => {
    setRefreshFn(refreshToken);
  }, [refreshToken]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await post<{
        access_token: string;
        user: { id: string; role: string; name: string; email: string };
      }>("/auth/login", { email, password });

      setAccessToken(data.access_token);

      const authUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        initials: makeInitials(data.user.name),
        subtitle: data.user.role,
      };
      setUser(authUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.data?.detail ?? "Invalid email or password." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await post("/auth/logout", {});
    } catch {
      // best-effort
    }
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent",
  school_admin: "School Admin",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  student: "oklch(0.6 0.2 220)",      // blue
  teacher: "oklch(0.65 0.22 145)",    // green
  parent: "oklch(0.55 0.24 265)",     // indigo
  school_admin: "oklch(0.6 0.22 25)", // orange-red
};
