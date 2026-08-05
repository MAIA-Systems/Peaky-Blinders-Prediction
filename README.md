# Peaky Blinders Prediction Market

A white-label prediction-market experience ("FanEngine", badged IPX) demoed under a
Peaky Blinders skin. See [`ENGINEERING_REPORT.md`](./ENGINEERING_REPORT.md) for the
full story of how this repo got here, and [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)
for what's actually real vs. still a demo right now.

## Layout

```
app/                    The real thing — Vite + React + TypeScript source.
                         This is what you build on. See app/README.md to run it
                         and for exactly how to wire up a real backend.

index.html               \
index-*.js / index-*.css  |  The original compiled build as delivered — kept
assets/                   |  for reference. Static, no backend, demo data only.
login.html, signup.html  /

*.jpg.jpeg               Original brand images (hero backdrop, stream demo,
                         streamer avatar), also copied into app/public/images/.
```

## Quick start

```bash
cd app
npm install
npm run dev:full    # http://localhost:3000 — frontend + API together (needs app/.env.local)
```

`npm run dev` alone only serves the frontend on :5173 — auth, wallet and every other
`/api/*` route need `dev:full` (see `app/README.md` for what goes in `.env.local`).
