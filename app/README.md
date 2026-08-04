# Peaky Blinders Prediction Market — App

Full React source rebuild of the project the client originally sent as a compiled
build (`index.html` + a minified JS/CSS bundle, no source). This is a real,
runnable codebase meant to be the foundation the actual backend gets plugged
into — not another static mockup.

The visual design (colors, fonts, spacing, copy) was reverse-engineered from
the original bundle so this renders identically, but every component, page,
and the mock data layer were rebuilt from scratch as proper source.

## Stack

- **Vite + React 18 + TypeScript**
- **React Router v6** — client-side routing
- **TanStack Query** — data fetching/caching/mutations
- **Tailwind CSS** — styled with the original's exact design tokens (see `src/index.css`)
- **Zod** — form/schema validation
- **lucide-react** — icons

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
```

There's a seeded demo account for testing the auth flow:
`ben@example.com` / `peakyblinders`

## Structure

```
src/
  api/            Mock "backend" — see Backend Integration below
    client.ts       fetch() wrapper + delay() helper, already shaped for a real API
    mockData.ts      in-memory seed data (markets, positions, transactions, users)
    markets.ts       getMarkets, getMarket, createMarket, placeTrade
    wallet.ts        getWallet, getPositions, getTransactions, deposit, cashout
    auth.ts          login, signup, getCurrentUser, logout

  hooks/          React Query hooks wrapping the api/ functions, + AuthProvider

  components/
    ui/             Design-system primitives (Button, Input, Card, Badge, Select…)
    layout/         Header, Footer, Layout (the shell every route renders inside)
    ...             Logo, MarketCard, Sparkline, PoweredByBadge, ProtectedRoute

  pages/          One file per route (Home, MarketDetail, Portfolio, Wallet,
                  CreateMarket, Profile, Stream, Login, Signup, NotFound)

  types/          Shared TypeScript types (Market, Position, Transaction, User…)
  lib/            utils (formatting/cn), validation (zod schemas), priceHistory
```

## Backend integration — how to wire up the real thing

Nothing in `pages/` or `components/` talks to `mockData.ts` directly — they
only go through the hooks in `src/hooks/`, which call the functions in
`src/api/`. That's the seam. To swap in a real backend:

1. Set `VITE_API_URL` (`.env.local`) to point at it.
2. In each `src/api/*.ts` file, replace the body of each function with a
   `request()` call from `client.ts` — the function signatures and return
   types already match what the rest of the app expects, so nothing in
   `hooks/`, `pages/`, or `components/` needs to change.

   Example (`markets.ts`):
   ```ts
   // before
   export async function getMarkets(category?: Category | "All") {
     const list = !category || category === "All" ? markets : markets.filter(...);
     return delay(list);
   }

   // after
   export async function getMarkets(category?: Category | "All") {
     return request<Market[]>(`/markets${category && category !== "All" ? `?category=${category}` : ""}`);
   }
   ```
3. `auth.ts`'s mock uses a plaintext in-memory user list + a `localStorage`
   session id — replace with real cookie/JWT-based auth once there's a server
   to issue it. `ProtectedRoute` and `useAuth()` don't need to change; they
   just care about `user`/`isAuthenticated`.
4. Delete `mockData.ts` once nothing imports it.

### Known mock-only simplifications worth telling the backend team about

- **Trade pricing** is a simple linear price-impact model (`markets.ts`,
  `TRADE_IMPACT`), not a real market maker (e.g. LMSR). Fine for demoing the
  UI; not what should run in production.
- **"Realised P/L"** on Profile/Portfolio is net cash flow from trades +
  cashouts, not true realised P/L against cost basis per closed position —
  the mock doesn't track that linkage. A real backend should compute this
  properly per-position.
- State lives in memory only (module-level arrays) — it resets on a full
  page reload, unlike a real backend. That's expected for a mock.

## What's carried over from the original brand

Colors, type system (Playfair Display / DM Sans / JetBrains Mono), the six
market categories, the FanEngine/IPX white-label framing, and the exact
marketing copy ("Where culture becomes a market…", "By Order of the Peaky
Blinders", etc.) were all taken from the original compiled bundle so this is
a drop-in continuation of that brand, not a redesign.
