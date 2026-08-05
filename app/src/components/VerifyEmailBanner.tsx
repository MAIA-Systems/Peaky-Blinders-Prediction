import { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function VerifyEmailBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerifiedAt) return null;

  async function handleResend() {
    setStatus("sending");
    setError(null);
    try {
      await resendVerificationEmail();
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't send that — try again shortly.");
    }
  }

  return (
    <div className="border-b border-gold/20 bg-gold/5 px-4 py-2.5 text-center text-xs text-gold-bright md:px-6">
      <span className="inline-flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5" />
        {status === "sent" ? (
          "Verification email sent — check your inbox."
        ) : (
          <>
            Verify your email to secure your account.{" "}
            <button onClick={handleResend} disabled={status === "sending"} className="underline underline-offset-2 hover:text-gold" data-testid="button-resend-verification">
              {status === "sending" ? "Sending…" : "Resend email"}
            </button>
          </>
        )}
      </span>
      {status === "error" && <div className="mt-1 text-destructive">{error}</div>}
    </div>
  );
}
