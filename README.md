# DealScope frontend

Front end for [DealScope](https://github.com/ram-vp/dealscope), the Indian M&A target screener and peer valuation engine.

Live site: [dealscope-screener.vercel.app](https://dealscope-screener.vercel.app)

## Stack

TypeScript, Next.js (static), Tailwind, pnpm. No database, no accounts, no environment variables.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm lint`, `pnpm typecheck` | Static checks |
| `pnpm test` | Unit tests, plus every percentile, valuation range and band re-derived from the data |
| `pnpm build && pnpm test:e2e` | Browser, accessibility and rendered-number tests |
| `pnpm build && pnpm start`, then `pnpm lighthouse` | Lighthouse budget |
| `pnpm parity` | Compare `data/` with what the backend published |

`pnpm test:e2e` needs `pnpm exec playwright install chromium` once, and `python3` for the canary contract test.

## Data

`data/*.json` is written by the backend's bot through `.github/workflows/apply-data-bot.yml`. Don't edit it by hand.
See [SETUP.md](SETUP.md), and [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for UI work.
