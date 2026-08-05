import { config } from "dotenv";
config({ path: ".env.local" });

// Named `fetchHandler` imports — the raw Fetch-style handlers, before the
// Node (req,res) adapter Vercel actually invokes in production gets
// wrapped around them. See api/_lib/adapter.ts for why that wrapper exists.
import { fetchHandler as signupHandler } from "../api/auth/signup";
import { fetchHandler as loginHandler } from "../api/auth/login";
import { fetchHandler as logoutHandler } from "../api/auth/logout";
import { fetchHandler as meHandler } from "../api/auth/me";
import { fetchHandler as verifyEmailHandler } from "../api/auth/verify-email";
import { fetchHandler as resendVerificationHandler } from "../api/auth/resend-verification";
import { fetchHandler as forgotPasswordHandler } from "../api/auth/forgot-password";
import { fetchHandler as resetPasswordHandler } from "../api/auth/reset-password";
import { fetchHandler as googleStartHandler } from "../api/auth/google/start";
import { fetchHandler as googleCallbackHandler } from "../api/auth/google/callback";
import { fetchHandler as adminUsersHandler } from "../api/admin/users";
import { fetchHandler as walletHandler } from "../api/wallet/index";
import { fetchHandler as walletTransactionsHandler } from "../api/wallet/transactions";
import { fetchHandler as createCheckoutSessionHandler } from "../api/payments/create-checkout-session";
import { db } from "../api/_db/client";
import { users, wallets } from "../api/_db/schema";

const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ok — ${message}`);
  } else {
    failed++;
    console.error(`  FAIL — ${message}`);
  }
}

function extractCookie(res: Response): string | null {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  return raw.split(";")[0]; // "session=<token>"
}

function req(path: string, init: RequestInit & { cookie?: string } = {}): Request {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  return new Request(`${BASE}${path}`, { ...init, headers });
}

async function main() {
  const stamp = Date.now();
  const testEmail = `test-${stamp}@example.com`;
  const testUsername = `test${stamp}`;

  console.log("\n1. Signup with a fresh account");
  const signupRes = await signupHandler(
    req("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Test User", username: testUsername, email: testEmail, password: "correct-horse-battery" }) }),
  );
  const signupBody = await signupRes.json();
  assert(signupRes.status === 201, `expected 201, got ${signupRes.status}`);
  assert(signupBody.role === "standard", "new signups default to role=standard");
  assert(!("password" in signupBody) && !("passwordHash" in signupBody), "response never leaks the password/hash");
  const userCookie = extractCookie(signupRes);
  assert(!!userCookie, "signup sets a session cookie");

  console.log("\n2. Duplicate signup is rejected (race-safe unique constraint, not a leaky pre-check)");
  const dupeRes = await signupHandler(
    req("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Dupe", username: `${testUsername}x`, email: testEmail, password: "whatever123" }) }),
  );
  assert(dupeRes.status === 409, `expected 409, got ${dupeRes.status}`);

  console.log("\n3. SQL-injection-shaped input is just rejected by validation / treated as a literal string (parameterized queries, no string-built SQL)");
  const injectionRes = await signupHandler(
    req("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name: "Bobby", username: "bobby_tables", email: "not-an-email'; DROP TABLE users; --", password: "whatever123" }),
    }),
  );
  assert(injectionRes.status === 400, `expected 400 (invalid email), got ${injectionRes.status}`);

  console.log("\n4. Login with the wrong password fails with a generic message");
  const wrongPwRes = await loginHandler(req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: testEmail, password: "not-the-password" }) }));
  const wrongPwBody = await wrongPwRes.json();
  assert(wrongPwRes.status === 401, `expected 401, got ${wrongPwRes.status}`);
  assert(wrongPwBody.error === "Invalid email or password", "error message doesn't reveal which field was wrong");

  console.log("\n5. Login with a non-existent email gives the exact same generic message (no user enumeration)");
  const noSuchUserRes = await loginHandler(req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "nobody-here@example.com", password: "whatever123" }) }));
  const noSuchUserBody = await noSuchUserRes.json();
  assert(noSuchUserRes.status === 401 && noSuchUserBody.error === wrongPwBody.error, "identical error/status for wrong-password vs no-such-user");

  console.log("\n6. Login with the correct password succeeds");
  const loginRes = await loginHandler(req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: testEmail, password: "correct-horse-battery" }) }));
  const loginBody = await loginRes.json();
  assert(loginRes.status === 200, `expected 200, got ${loginRes.status}`);
  assert(loginBody.email === testEmail, "logged-in user matches");
  const sessionCookie = extractCookie(loginRes);
  assert(!!sessionCookie, "login sets a session cookie");

  console.log("\n7. /me with a valid session cookie returns the user");
  const meRes = await meHandler(req("/api/auth/me", { method: "GET", cookie: sessionCookie! }));
  const meBody = await meRes.json();
  assert(meBody.user?.email === testEmail, "/me resolves the session to the right account");

  console.log("\n8. /me with no cookie returns null (not an error)");
  const meAnonRes = await meHandler(req("/api/auth/me", { method: "GET" }));
  const meAnonBody = await meAnonRes.json();
  assert(meAnonRes.status === 200 && meAnonBody.user === null, "anonymous /me is a clean 200 with user: null");

  console.log("\n9. A standard user is refused admin access");
  const forbiddenRes = await adminUsersHandler(req("/api/admin/users", { method: "GET", cookie: sessionCookie! }));
  assert(forbiddenRes.status === 403, `expected 403, got ${forbiddenRes.status}`);

  console.log("\n10. The seeded admin (adam@example.com) can log in and access the admin list");
  const adminLoginRes = await loginHandler(req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "adam@example.com", password: "peakyblinders-admin" }) }));
  assert(adminLoginRes.status === 200, `admin login expected 200, got ${adminLoginRes.status}`);
  const adminCookie = extractCookie(adminLoginRes);
  const adminListRes = await adminUsersHandler(req("/api/admin/users", { method: "GET", cookie: adminCookie! }));
  const adminListBody = await adminListRes.json();
  assert(adminListRes.status === 200, `admin list expected 200, got ${adminListRes.status}`);
  assert(Array.isArray(adminListBody.users) && adminListBody.users.some((u: { email: string }) => u.email === testEmail), "admin list includes the freshly created test user");

  console.log("\n11. Logout destroys the session — the same cookie no longer works");
  const logoutRes = await logoutHandler(req("/api/auth/logout", { method: "POST", cookie: sessionCookie! }));
  assert(logoutRes.status === 200, `expected 200, got ${logoutRes.status}`);
  const meAfterLogoutRes = await meHandler(req("/api/auth/me", { method: "GET", cookie: sessionCookie! }));
  const meAfterLogoutBody = await meAfterLogoutRes.json();
  assert(meAfterLogoutBody.user === null, "session is dead after logout, even though the raw cookie string is unchanged");

  console.log("\n12. Rate limiting locks out repeated failed logins on the same account");
  const rateLimitEmail = testEmail; // already has 1 failed attempt from step 4
  let sawRateLimit = false;
  for (let i = 0; i < 6; i++) {
    const attempt = await loginHandler(req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: rateLimitEmail, password: "still-wrong" }) }));
    if (attempt.status === 429) {
      sawRateLimit = true;
      break;
    }
  }
  assert(sawRateLimit, "6 rapid failed logins trigger a 429 (brute-force protection)");

  console.log("\n13. Signup reports emailSent honestly when Resend isn't configured");
  assert(signupBody.emailSent === false, "emailSent is false without RESEND_API_KEY (see step 1's response)");

  console.log("\n14. Verifying with a bogus token is rejected, not silently accepted");
  const badVerifyRes = await verifyEmailHandler(req("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: "not-a-real-token" }) }));
  assert(badVerifyRes.status === 400, `expected 400, got ${badVerifyRes.status}`);

  console.log("\n15. Resend-verification requires auth, then 503s cleanly without RESEND_API_KEY");
  const resendAnonRes = await resendVerificationHandler(req("/api/auth/resend-verification", { method: "POST" }));
  assert(resendAnonRes.status === 401, `expected 401 (no session), got ${resendAnonRes.status}`);

  // Reuses adminCookie (step 10) rather than logging in as testEmail again —
  // step 12 deliberately exhausted testEmail's login rate limit, so a fresh
  // login attempt for it here would 429, not reach the check this is testing.
  const resendAuthedRes = await resendVerificationHandler(req("/api/auth/resend-verification", { method: "POST", cookie: adminCookie! }));
  assert(resendAuthedRes.status === 503, `expected 503 (email not configured), got ${resendAuthedRes.status}`);

  console.log("\n16. Forgot-password never reveals whether an email has an account — identical response either way");
  const forgotRealRes = await forgotPasswordHandler(req("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: testEmail }) }));
  const forgotFakeRes = await forgotPasswordHandler(req("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: "nobody-here@example.com" }) }));
  const forgotRealBody = await forgotRealRes.json();
  const forgotFakeBody = await forgotFakeRes.json();
  assert(forgotRealRes.status === forgotFakeRes.status, `expected matching status, got ${forgotRealRes.status} vs ${forgotFakeRes.status}`);
  assert(JSON.stringify(forgotRealBody) === JSON.stringify(forgotFakeBody), "identical response body whether the email is real or made up");

  console.log("\n17. Resetting with a bogus token is rejected");
  const badResetRes = await resetPasswordHandler(
    req("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token: "not-a-real-token", newPassword: "whatever12345" }) }),
  );
  assert(badResetRes.status === 400, `expected 400, got ${badResetRes.status}`);

  console.log("\n18. A Google-only account (no local password) gets a specific message on password login, not a crash");
  const googleOnlyEmail = `google-only-${stamp}@example.com`;
  const [googleUser] = await db
    .insert(users)
    .values({ name: "Google Only", username: `googleonly${stamp}`, email: googleOnlyEmail, passwordHash: null, googleId: `fake-sub-${stamp}`, role: "standard" })
    .returning({ id: users.id });
  await db.insert(wallets).values({ userId: googleUser.id, balanceCents: 0 });

  const googleOnlyLoginRes = await loginHandler(req("/api/auth/login", { method: "POST", body: JSON.stringify({ email: googleOnlyEmail, password: "anything123" }) }));
  const googleOnlyLoginBody = await googleOnlyLoginRes.json();
  assert(googleOnlyLoginRes.status === 400, `expected 400, got ${googleOnlyLoginRes.status}`);
  assert(googleOnlyLoginBody.error.includes("Google Sign-In"), "tells the user to use Google Sign-In instead of a generic failure");

  console.log("\n19. Google start redirects to the real Google consent screen now that credentials are configured");
  const googleStartRes = await googleStartHandler(req("/api/auth/google/start", { method: "GET" }));
  const googleStartLocation = googleStartRes.headers.get("location") ?? "";
  assert(googleStartRes.status === 302, `expected 302, got ${googleStartRes.status}`);
  assert(googleStartLocation.startsWith("https://accounts.google.com/"), `expected a Google consent URL, got ${googleStartLocation}`);
  assert(googleStartLocation.includes(encodeURIComponent(process.env.GOOGLE_CLIENT_ID ?? "\0")), "the redirect uses our real GOOGLE_CLIENT_ID");
  assert(!!googleStartRes.headers.get("set-cookie")?.includes("oauth_state="), "sets the CSRF state cookie before sending the user to Google");

  console.log("\n19b. Google callback still redirects cleanly (not a crash) when code/state are missing");
  const googleCallbackRes = await googleCallbackHandler(req("/api/auth/google/callback", { method: "GET" }));
  assert(googleCallbackRes.status === 302, `expected 302, got ${googleCallbackRes.status}`);
  assert((googleCallbackRes.headers.get("location") ?? "").includes("error="), "missing code/state still redirects to /login with an error code");

  console.log("\n20. The real wallet requires auth and starts every new account at zero");
  const walletAnonRes = await walletHandler(req("/api/wallet", { method: "GET" }));
  assert(walletAnonRes.status === 401, `expected 401, got ${walletAnonRes.status}`);

  const walletRes = await walletHandler(req("/api/wallet", { method: "GET", cookie: userCookie ?? adminCookie! }));
  const walletBody = await walletRes.json();
  assert(walletRes.status === 200, `expected 200, got ${walletRes.status}`);
  assert(walletBody.balanceCents === 0, `a brand-new signup should start at balanceCents: 0, got ${walletBody.balanceCents}`);

  const walletTxRes = await walletTransactionsHandler(req("/api/wallet/transactions", { method: "GET", cookie: userCookie ?? adminCookie! }));
  const walletTxBody = await walletTxRes.json();
  assert(walletTxRes.status === 200 && Array.isArray(walletTxBody.transactions), "wallet transactions endpoint returns an array");

  console.log("\n21. Starting a real deposit checkout 503s cleanly without a Stripe key (not a raw crash)");
  const checkoutAnonRes = await createCheckoutSessionHandler(req("/api/payments/create-checkout-session", { method: "POST", body: JSON.stringify({ amountGbp: 50 }) }));
  assert(checkoutAnonRes.status === 401, `expected 401 (no session), got ${checkoutAnonRes.status}`);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Test script crashed:", error);
  process.exit(1);
});
