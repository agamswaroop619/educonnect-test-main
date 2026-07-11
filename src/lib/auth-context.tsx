import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "teacher" | "parent" | "school_admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  subtitle: string;
}

const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  "teacher@school.edu": {
    id: "TCH-001",
    name: "Ms. Priya Nair",
    email: "teacher@school.edu",
    password: "teacher123",
    role: "teacher",
    initials: "PN",
    subtitle: "Class Teacher · Class 10-B",
  },
  "parent@school.edu": {
    id: "PAR-001",
    name: "Rajesh Swaroop",
    email: "parent@school.edu",
    password: "parent123",
    role: "parent",
    initials: "RS",
    subtitle: "Parent · Atam Swaroop (Class 10-B)",
  },
  "admin@school.edu": {
    id: "ADM-001",
    name: "Dr. Suresh Mehta",
    email: "admin@school.edu",
    password: "admin123",
    role: "school_admin",
    initials: "SM",
    subtitle: "Principal · Delhi Public School",
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "edu_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const found = MOCK_USERS[email.toLowerCase()];
    if (!found || found.password !== password) {
      return { success: false, error: "Invalid email or password." };
    }

    const { password: _pw, ...authUser } = found;
    setUser(authUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
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
  teacher: "Teacher",
  parent: "Parent",
  school_admin: "School Admin",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  teacher: "oklch(0.65 0.22 145)",   // green
  parent: "oklch(0.55 0.24 265)",    // indigo (primary)
  school_admin: "oklch(0.6 0.22 25)", // orange-red
};
