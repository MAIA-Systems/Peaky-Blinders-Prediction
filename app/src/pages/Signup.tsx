import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { GoogleButton } from "@/components/GoogleButton";
import { useAuth } from "@/hooks/useAuth";
import { signupSchema } from "@/lib/validation";

export function Signup() {
  const { signup, isSignupPending } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!agreed) {
      setError("You must agree to the Terms to continue.");
      return;
    }

    const result = signupSchema.safeParse({ name, username, email, password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    try {
      await signup(result.data);
      navigate("/", { replace: true });
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
      <h1 className="font-display text-center text-3xl font-semibold text-foreground">
        Create a <span className="text-gold">Community</span> account
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">From zero to your first trade in under 60 seconds.</p>

      <Card className="mt-8 w-full p-6">
        <GoogleButton label="Sign up with Google" />

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div>
            <Label htmlFor="name">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ben H" className="pl-9" data-testid="input-name" />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="benh" className="pl-9" data-testid="input-username" />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9"
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
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

          <div className="mt-4">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                data-testid="input-confirm-password"
              />
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[hsl(var(--gold))]"
              data-testid="checkbox-terms"
            />
            <span>I'm 18 or older and agree to the Terms and Privacy Policy. This is a demo environment — no real funds.</span>
          </label>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <Button type="submit" className="mt-6 w-full glow-gold" disabled={isSignupPending} data-testid="button-create-account">
            {isSignupPending ? "Creating account…" : "Create Account"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-gold underline underline-offset-2 hover:text-gold-bright" data-testid="link-login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
