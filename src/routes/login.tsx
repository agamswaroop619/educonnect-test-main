import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Eye, EyeOff, GraduationCap, Users, Building2, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const ROLE_OPTIONS: {
  role: UserRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
  email: string;
  password: string;
  color: string;
  bg: string;
}[] = [
  {
    role: "teacher",
    label: "Teacher",
    description: "Access class roster, attendance & grades",
    icon: GraduationCap,
    email: "teacher@school.edu",
    password: "teacher123",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
  },
  {
    role: "parent",
    label: "Parent",
    description: "Track your child's progress & updates",
    icon: Users,
    email: "parent@school.edu",
    password: "parent123",
    color: "text-primary",
    bg: "bg-primary/5 border-primary/20 hover:border-primary/60",
  },
  {
    role: "school_admin",
    label: "School Admin",
    description: "Manage school, staff & reports",
    icon: Building2,
    email: "admin@school.edu",
    password: "admin123",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200 hover:border-orange-400",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill credentials when a role card is clicked
  const handleRoleSelect = (option: (typeof ROLE_OPTIONS)[number]) => {
    setSelectedRole(option.role);
    setEmail(option.email);
    setPassword(option.password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate({ to: "/" });
    } else {
      setError(result.error ?? "Login failed.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight">Scholarly</h1>
            <p className="mt-1 text-sm text-muted-foreground">School Management Portal</p>
          </div>
        </div>

        <div className="card-surface px-6 py-8">
          <h2 className="mb-1 text-xl font-bold">Sign in to your account</h2>
          <p className="mb-6 text-sm text-muted-foreground">Select your role or enter your credentials below.</p>

          {/* Role selector */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = selectedRole === option.role;
              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => handleRoleSelect(option)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 text-center transition-all duration-150",
                    active
                      ? cn(option.bg, "ring-2 ring-offset-1", option.color === "text-emerald-600" ? "ring-emerald-400" : option.color === "text-primary" ? "ring-primary" : "ring-orange-400")
                      : cn("border-border bg-muted/30 hover:bg-accent", option.bg),
                    active && "shadow-md"
                  )}
                >
                  <div className={cn("grid h-9 w-9 place-items-center rounded-lg bg-white shadow-sm", active && "shadow-md")}>
                    <Icon className={cn("h-5 w-5", option.color)} />
                  </div>
                  <span className={cn("text-xs font-semibold leading-tight", active ? option.color : "text-foreground/70")}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hint text */}
          {selectedRole && (
            <p className="mb-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              ✓ Credentials auto-filled — click <strong>Sign in</strong> to continue, or enter your own.
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@school.edu"
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none ring-ring transition-shadow focus:ring-2 placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-12 text-sm outline-none ring-ring transition-shadow focus:ring-2 placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* Hint credentials */}
        <div className="mt-6 rounded-xl border border-border/60 bg-card/60 px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo credentials</p>
          <div className="grid gap-2">
            {ROLE_OPTIONS.map((o) => (
              <div key={o.role} className="flex items-center justify-between text-xs">
                <span className={cn("font-medium", o.color)}>{o.label}</span>
                <span className="text-muted-foreground">{o.email} · {o.password}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
