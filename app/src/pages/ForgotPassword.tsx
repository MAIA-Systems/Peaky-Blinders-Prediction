import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { forgotPassword } from "@/api/auth";
import { forgotPasswordSchema } from "@/lib/validation";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setPending(true);
    try {
      await forgotPassword(result.data.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 md:py-24">
      <Logo linkTo="/" />

      <h1 className="font-display mt-8 text-center text-3xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>

      <Card className="mt-8 w-full p-6">
        {sent ? (
          <p className="text-sm text-yes-fg" data-testid="text-reset-sent">
            If that email has an account, we've sent a reset link. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
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

            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

            <Button type="submit" className="mt-6 w-full glow-gold" disabled={pending} data-testid="button-send-reset">
              {pending ? "Sending…" : "Send reset link"}
            </Button>
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
