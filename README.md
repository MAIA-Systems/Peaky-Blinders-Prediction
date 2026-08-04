# Peaky Blinders Prediction Market

A white-label prediction-market experience ("FanEngine", badged IPX) demoed under a
Peaky Blinders skin. See [`ENGINEERING_REPORT.md`](./ENGINEERING_REPORT.md) for the
full story of how this repo got here.

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
npm run dev        # http://localhost:5173
```

Demo account: `ben@example.com` / `peakyblinders`
