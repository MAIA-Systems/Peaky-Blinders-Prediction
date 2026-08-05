const MESSAGES: Record<string, string> = {
  google_not_configured: "Google Sign-In isn't set up yet.",
  google_denied: "Google sign-in was cancelled.",
  google_state_mismatch: "That sign-in link expired or was already used — try again.",
  google_email_unverified: "That Google account's email isn't verified with Google.",
  google_failed: "Something went wrong signing in with Google. Try again.",
};

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "Something went wrong. Try again.";
}
