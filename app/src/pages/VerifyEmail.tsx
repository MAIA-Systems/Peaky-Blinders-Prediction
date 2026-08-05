import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { verifyEmail } from "@/api/auth";

type Status = "verifying" | "success" | "error";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("This verification link is missing its token.");
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Something went wrong");
      });
    // Runs once on mount for the token in the URL — intentionally not
    // re-running if `queryClient` identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 md:py-24">
      <Logo linkTo="/" />

      <Card className="mt-8 w-full p-6 text-center">
        {status === "verifying" && <p className="text-sm text-muted-foreground">Verifying your email…</p>}
        {status === "success" && (
          <>
            <p className="text-sm text-yes-fg">Your email is verified.</p>
            <Link to="/" className="mt-4 inline-block">
              <Button className="glow-gold">Go to markets</Button>
            </Link>
          </>
        )}
        {status === "error" && <p className="text-sm text-destructive">{error}</p>}
      </Card>
    </div>
  );
}
