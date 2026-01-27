# AlphaSeeker — Quantitative Crypto Intelligence (local dev)

A modular React demo that simulates a multi-module crypto intelligence pipeline (ingest → score → decide → simulate execution → observability).

This README provides minimal, practical steps to run and test the app locally, plus short troubleshooting notes.

## Quick Start (recommended)

1. Open a terminal in the `TradingApp` folder:

```powershell
cd C:\Users\LG\Desktop\herbelia\APP\TradingApp
```

2. Install dependencies (one-time):

```powershell
npm install
```

3. Start the Vite dev server (TSX, HMR):

```powershell
npm run dev
# If port 3000 is busy, Vite will pick a nearby free port (e.g. 3001).
```

4. Open the `Local` URL printed by Vite (e.g. `http://localhost:3000` or `http://localhost:3001`).

## Quick static smoke-test

If you only want a fast check without TSX compilation, use the static server:

```powershell
npm run start
# then open http://localhost:3000
```

Note: a temporary fallback entry (`index.dev.js`) was created to show a visible page while debugging. The full React app is served by Vite when running `npm run dev`.

## Useful commands

```powershell
# Start dev server with HMR
npm run dev

# Serve statically (no build)


# Type-check TypeScript
npm run type-check
```

## Troubleshooting

- Blank page in browser: open DevTools (F12) → Console. Copy errors here.
- Port already in use: Vite will try another port; use the `Local` URL shown in terminal.
- If React components fail to load, run `npm run type-check` to surface TS errors.
- To verify static fallback loads:
  - Open `http://localhost:3000/index.dev.js` in the browser; it should return the fallback JS.

## Temporary & cleanup notes

- A small fallback file `index.dev.js` was added to `TradingApp` to allow quick smoke-testing without a full TSX build. Once you're satisfied the Vite dev server is working, you can remove `index.dev.js` and restore `index.html` (already restored to use `/index.tsx`).

## Disclaimer

This repository is a simulation and demo only. It uses mock data and does not execute real trades or provide financial advice.
