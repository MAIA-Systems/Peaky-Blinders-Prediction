# Real Project Status — Peaky Blinders Prediction Market

**Date:** 5 August 2026
**Overall status:** Auth and wallet are fully real, tested, and confirmed working in production. Markets/trading are still a client-side simulation.
**Git:** Committed and pushed to `main`. Deployed on Vercel at `peak-blienders-prediction.vercel.app`.
**Production check:** Verified live — signed in with a real Google account, real name/username/join date loaded, wallet showed the correct real balance (£0.00 for a brand-new account), Portfolio correctly showed the "Demo" data instead.

---

## 1. Executive summary

The project today has **two halves at very different levels of "real"**, and it's important not to mix them up:

- **Auth + Wallet**: a real system, backed by a Postgres database (Neon), secure sessions, and money (test mode) actually processed by Stripe. Tested end-to-end, including a real test-card deposit that went through the webhook and credited the balance.
- **Markets + Trading (Portfolio)**: still the original simulation — data hardcoded in the frontend, identical for every account, with no connection to a real user or the real balance. It's labeled with a "Demo" badge on screen so it's never mistaken for the real thing.

---

## 2. What is REAL today

### 2.1 Authentication
- Signup, login, logout — passwords hashed with **bcrypt** (12 rounds)
- Sessions live in an `httpOnly` + `SameSite=Lax` cookie (+ `Secure` in production), stored as a hash in Postgres — genuinely revocable, not a JWT
- **Rate limiting**: 5 wrong login attempts lock the account for 15 minutes; the same protection covers password-reset requests and verification-email resends
- Generic error messages on login (never reveals whether an email exists)
- **Email verification**: single-use token, expires in 24h, sent via Resend
- **Forgot password**: single-use token, expires in 1h, and **kills every other session** the moment the password is changed
- **Google Sign-In**: full OAuth flow with CSRF protection (state cookie), only trusts emails Google itself marked as verified
- **Two roles**: `standard` and `admin`, enforced server-side every time — a real `/admin` panel listing real users from the database

### 2.2 Wallet and payments
- Real, per-user balance in Postgres (`wallets` table)
- Deposits via **Stripe Checkout** — we never collect card numbers in our own form (doing so would be a serious PCI-compliance violation)
- A **Stripe webhook** confirms payment and credits the balance automatically, with signature verification (rejects forged events)
- Tested with real test money: a £100 deposit → went through Stripe → webhook credited it → balance moved from £917.55 to £1017.55

### 2.3 Database (Neon Postgres)
Real tables in production: `users`, `sessions`, `login_attempts`, `rate_limit_events`, `email_verification_tokens`, `password_reset_tokens`, `wallets`, `transactions`.

### 2.4 Security — what's actually been tested
41 automated tests (`npm run test:backend`), run against the real database, covering:
- SQL injection (rejected by validation / the parameterized ORM)
- Duplicate signups (race condition handled via a database constraint, not a check-then-insert)
- User enumeration (identical response for wrong password vs. wrong email vs. no such account)
- Brute-force rate limiting
- A Google-only account attempting a password login (specific message, no crash)
- RBAC (a standard user is blocked from the admin panel)
- Sessions actually die on logout
- Stripe checkout fails gracefully without a configured key

### 2.5 Production deployment
Getting this onto Vercel surfaced two bugs that never showed up in local testing, because local testing (via `tsx`) doesn't exercise the exact same request path Vercel uses:

1. **Module resolution crash (`ERR_MODULE_NOT_FOUND`)** — every `/api/*` route imports other files with a relative path (e.g. `../_lib/session`). `tsx` resolves that itself; Node's real ESM loader, which is what runs the compiled functions on Vercel, requires the explicit `.js` extension. Fixed by switching `tsconfig.api.json` to `moduleResolution: "NodeNext"` (which makes the compiler itself flag every offending import) and adding `.js` to all of them.
2. **Handler signature mismatch (`req.headers.get is not a function`, `Invalid URL`)** — every route was written against the Fetch API (`Request` in, `Response` out). Vercel's Node.js runtime actually invokes functions with the classic `(req, res)` Node signature, not a Fetch-style one. Fixed by adding `api/_lib/adapter.ts`, a thin conversion layer — each route now exports a `fetchHandler` (the original logic, used directly by the test suite) and a `default` export (`fetchHandler` through the adapter, what Vercel actually calls).

Both were root-caused from the Vercel Runtime Logs (not guessed), fixed, and re-verified against the real HTTP path locally before pushing again. The current deployment has signed in via Google, loaded `/api/auth/me` and `/api/wallet` with real `200`s, with no errors in the logs since.

---

## 3. What is still a DEMO (mock)

| Screen | What it shows | Where it comes from |
|---|---|---|
| Markets list (Home) | Questions to trade on, prices, volume | Hardcoded in the frontend (`src/api/mockData.ts`), no backend |
| Individual market page | Chart, buying YES/NO | Simulated in the browser, doesn't persist |
| Portfolio | Open positions, P/L | Same fixed data, identical for every account |
| Profile → "Trading Stats" / "Recent Activity" | 6 trades, -£182.45 P/L, etc. | Same fixed data — labeled with a "Demo" badge |

None of these screens are connected to the real balance or the logged-in user. Migrating this to Postgres is a project of similar size to what was just done for auth — not yet started.

---

## 4. External services — configuration status

| Service | Status | Note |
|---|---|---|
| **Neon** (database) | ✅ Connected and migrated | Confirmed reachable from the live Vercel deployment |
| **Google OAuth** | ✅ Published to production | Tested end-to-end, including on the live domain |
| **Vercel environment variables** | ✅ Set | All 8 variables added in the dashboard and confirmed working in production |
| **Resend** (email) | ⚠️ Configured, but... | `EMAIL_FROM` still uses the sandbox domain (`resend.dev`) — it only delivers to your own Resend account email until you verify a real domain |
| **Stripe** | ⚠️ Test mode, works locally only | Tested via the Stripe CLI (`stripe listen`) locally, including a real webhook-confirmed deposit. **The production webhook hasn't been registered on Vercel yet** — you need to add the endpoint in the Stripe dashboard pointing at the deployed domain, and paste that (different) signing secret into Vercel's environment variables |

---

## 5. Environment variables

Live in both `app/.env.local` (local dev, never committed) and Vercel's dashboard (Project Settings → Environment Variables) for Production:

```
DATABASE_URL            ✅
SESSION_SECRET          ✅
STRIPE_SECRET_KEY       ✅ (test mode)
STRIPE_WEBHOOK_SECRET   ✅ but holds the local Stripe-CLI value — needs a
                           production-specific one once the webhook below is registered
RESEND_API_KEY          ✅
EMAIL_FROM              ✅ (sandbox domain — see §4)
GOOGLE_CLIENT_ID        ✅
GOOGLE_CLIENT_SECRET    ✅
```

---

## 6. Recommended next steps, in order of impact

1. **Register the Stripe webhook on Vercel** (Stripe dashboard → Developers → Webhooks → point at the deployed domain) — without this, production deposits never credit the balance. Replace `STRIPE_WEBHOOK_SECRET` in Vercel with the signing secret that registration gives you.
2. **Verify a domain on Resend** — without this, verification/reset emails only ever reach you, not real users
3. **Decide if/when to migrate markets and trading to a real backend** — that's what it would take for Portfolio to stop being "Demo"
4. **KYC/compliance**, if real (non-test-mode) money is ever involved

---

*Compiled from the working session of 5 August 2026, updated same day after confirming the production deployment on Vercel.*
