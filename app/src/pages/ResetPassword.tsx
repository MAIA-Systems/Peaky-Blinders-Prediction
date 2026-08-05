import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { resetPassword } from "@/api/auth";
import { resetPasswordSchema } from "@/lib/validation";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setPending(true);
    try {
      const user = await resetPassword(token, result.data.password);
      queryClient.setQueryData(["auth", "currentUser"], user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 md:py-24">
      <Logo linkTo="/" />

      <h1 className="font-display mt-8 text-center text-3xl font-semibold text-foreground">Choose a new password</h1>

      <Card className="mt-8 w-full p-6">
        {!token ? (
          <p className="text-sm text-destructive">This reset link is missing its token — copy the full link from your email.</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
                data-testid="input-password"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="confirm-password">Confirm new password</Label>
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

            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

            <Button type="submit" className="mt-6 w-full glow-gold" disabled={pending} data-testid="button-reset-password">
              {pending ? "Saving…" : "Save new password"}
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground">This also signs you out of every other device.</p>
          </form>
        )}
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/login" className="text-gold underline underline-offset-2 hover:text-gold-bright">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
