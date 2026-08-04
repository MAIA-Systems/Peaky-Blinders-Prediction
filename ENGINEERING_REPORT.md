# Engineering Report — Peaky Blinders Prediction Market

**Date:** 4 August 2026
**Source:** peaky-predictions.pplx.app
**Branding:** IPX / FanEngine
**Status:** Foundation ready for backend integration

---

## Summary

We were sent a link and a folder described as "the files." The folder turned out to be a **compiled production build** — minified JS and CSS, no source — and it had two packaging bugs that stopped it from even running locally. Reading that bundle showed the underlying product: a white-label prediction-market engine ("FanEngine", badged IPX) demoed under a Peaky Blinders skin, with categories spanning Film & TV, Sports, Politics, Music, Esports and Crypto.

Across four passes we made the build runnable locally, prototyped the missing Login/Sign Up screens, and then rebuilt the entire product as a proper React + TypeScript source tree — matched pixel-for-pixel to the original design, functionally real (working auth, working trades, working wallet), and structured with one clear seam for a backend to be dropped into.

---

## 1. What we received

Six files and a live link. No `package.json`, no components, no repository — the link and the folder were the same build, just two ways of looking at it.

| File | Size | What it turned out to be |
|---|---|---|
| `index.html` | 13 KB | Vite entry shell, plus an embedded screenshot/edit script confirming this was exported from Perplexity's app builder (pplx.app) |
| `index-CepjMLBM.js` | 553 KB | The entire app, minified — React 18.3.1, routing, every page, all copy and validation rules |
| `index-DQh77i9V.css` | 81 KB | Compiled Tailwind — every color token, font stack and component class the product uses |
| `home-backdrop-*.jpg.jpeg` | 117 KB | Hero backdrop (Birmingham industrial skyline). Double extension — a download artifact |
| `game-feed-*.jpg.jpeg` | 277 KB | Twitch-embed demo still frame |
| `streamer-avatar-*.jpg.jpeg` | 39 KB | Avatar for the demo streamer, "TommyGunGaming" |

**Two bugs blocked local use** before any of the above could even be inspected in a browser: the HTML pointed at `./assets/…`, but the JS/CSS sat flat in the folder, and all three images carried a doubled `.jpg.jpeg` extension the code never asked for.

---

## 2. What it actually is

Reading the minified bundle in full — routes, copy strings, zod validation rules, CSS custom properties — surfaced a product quite different from "a Peaky Blinders app."

The Peaky Blinders skin is a demo of a general-purpose product. The app's own footer says it outright: *"Where culture becomes a market. A white-label prediction market experience built on FanEngine infrastructure. Demo environment — no real funds."* One screen in the app even simulates the same widget embedded live inside a Twitch stream, trading against the same wallet — the actual pitch is "any IP, any platform, one infrastructure," with Peaky Blinders as the example skin and category, not the whole product.

**Stack and characteristics identified:**
- React 18.3.1
- Tailwind design system (shadcn/ui-style)
- Typography: Playfair Display + DM Sans + JetBrains Mono
- 6 categories: Film & TV, Sports, Politics, Music, Esports, Crypto
- 7 routes (Home, market detail, Portfolio, Wallet, Create Market, Profile, Stream)
- 8 `/api/*` endpoints referenced in the code, none implemented (no backend)

---

## 3. What we did

Four passes, each triggered by a different ask, each building on what the last one had already figured out about the bundle.

### 01 — Analysis ✅
**Trigger:** "analyse the files and the link"
- Tried the live link first: it's a client-rendered SPA behind hash routing, so an automated fetch only ever sees the `<title>` tag — the files were the reliable source, not the URL
- Reverse-read the minified JS for every route, every button's copy, the zod rules behind market creation, and the six market categories
- Pulled the full design system out of the compiled CSS: every color token, the button/input/card class strings, the logo SVG, the footer markup — verbatim, not guessed

### 02 — Made the original build runnable ✅
**Trigger:** "how do I test this locally?"
- Diagnosed the two packaging bugs from section 1 by tracing the exact filenames the JS asked for via `import.meta.url`
- Copied the assets into a corrected `assets/` folder with the right names — originals left untouched
- Served it locally and confirmed the shell renders correctly; flagged that anything data-driven would stay blank, since the `/api/*` calls have nowhere to land without a backend

### 03 — Login / Sign Up prototype ✅
**Trigger:** boss — "we may need some basic auth and payments facility"
- Payments already existed in the build (the Wallet screen); auth was the real gap — the app loaded straight in as a signed-in user with no way to sign in
- Built `login.html` / `signup.html` as static, standalone pages, reusing the exact extracted classes and tokens so they sit indistinguishably next to the original screens
- Rendered both headlessly and compared side-by-side against the original before calling it done

### 04 — Full React rebuild ✅
**Trigger:** "give the project a real foundation, in React if needed, to integrate a backend into later"
- New source tree in `app/`: Vite + React 18 + TypeScript + Tailwind + React Router + TanStack Query + Zod
- Every page rebuilt as a real component — Home, Market detail, Portfolio, Wallet, Create Market, Profile, Stream, Login, Sign Up, 404 — plus a shared UI kit (Button, Input, Card, Badge, Select…) carrying the exact original classes
- An in-memory mock API layer standing in for the backend — typed, and shaped so each function's body is the only thing that changes when a real server exists
- Auth, protected routes and the trading engine all genuinely work: buying YES/NO deducts real balance, opens or grows a position, and moves the market's odds
- Tested end-to-end in an actual browser session — signed in, placed a trade, confirmed it landed in Portfolio and Wallet — which is how we caught and fixed a real bug (two buttons sharing one test id, so the wrong one was being clicked)

---

## 4. Before / after

| What we were handed | What exists now |
|---|---|
| Minified build output — unreadable, unmaintainable | ~40-file TypeScript source tree, typed end to end |
| No source, no components, no repository | Design system matched to the original, verified on screen |
| Wouldn't run locally (asset path + filename bugs) | Runs with `npm install && npm run dev` |
| No auth screens at all | Working sign-in / sign-up, with a seeded demo account |
| Every data screen calls an `/api/*` endpoint that doesn't exist anywhere | A mock API layer standing in for the backend, with one documented seam to swap it for the real thing |

---

## 5. Recommended next steps

The frontend no longer blocks backend work. What's left is deciding how the real system should behave in the places the mock only approximates.

1. **Build the backend against the existing contract** — every screen already calls a typed function in `src/api/*.ts` — implement those against real endpoints and nothing in the UI needs to change.
2. **Replace the mock auth** — currently a plaintext in-memory list + a localStorage flag, purely to make the protected routes demoable. Needs real sessions/JWTs before this touches real users.
3. **Wire up real payments** — the Wallet screen's card/Apple Pay/Google Pay/crypto flows are all simulated. This is the actual "payments facility" the ask was about — needs a provider (Stripe or similar) behind it.
4. **Decide the pricing model** — the mock moves odds with a simple linear nudge per trade. A real market needs a real mechanism — LMSR or an order book — decided before liquidity is real money.
5. **KYC / compliance review** — once funds are real, age/identity verification and regional betting-market compliance need sign-off before launch.

---

*Compiled from the working session, 4 August 2026.*
