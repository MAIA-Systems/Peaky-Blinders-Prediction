import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { GoogleButton } from "@/components/GoogleButton";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/lib/validation";
import { oauthErrorMessage } from "@/lib/oauthErrors";

export function Login() {
  const { login, isLoginPending } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    try {
      await login(result.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 md:py-24">
      <Logo linkTo="/" />

      <div className="mb-4 mt-8 flex items-center gap-3">
        <span className="rule-gold w-10" />
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">By Order of the Peaky Blinders</span>
      </div>
      <h1 className="font-display text-center text-3xl font-semibold text-foreground">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Sign in to trade the film, the characters, the business — live, in seconds.</p>

      <Card className="mt-8 w-full p-6">
        {oauthError && <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{oauthError}</p>}

        <GoogleButton />

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">
                Password
              </Label>
              <Link to="/forgot-password" className="text-xs text-gold hover:text-gold-bright" data-testid="link-forgot-password">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-9"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <Button type="submit" className="mt-6 w-full glow-gold" disabled={isLoginPending} data-testid="button-sign-in">
            {isLoginPending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="text-gold underline underline-offset-2 hover:text-gold-bright" data-testid="link-signup">
          Create one
        </Link>
      </p>
    </div>
  );
}
