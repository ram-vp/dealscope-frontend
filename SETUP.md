# DealScope frontend

Public site for [dealscope-screener.vercel.app](https://dealscope-screener.vercel.app).
Data is JSON produced by `ram-vp/dealscope`, served as prerendered static files.

```
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Data files

| File | Loaded when |
|---|---|
| `data/companies.json` | On intent or a deep link, as `/data/universe` |
| `data/deals.json` | With the universe |
| `data/narratives.json` | Per tear sheet, as `/data/company/<shard>` |
| `data/news.json` | Per tear sheet, same shard |
| `data/dataset-meta.json` | Header dates |
| `data/filter-bands.json` / `data/sector-bands.json` | Filters and NL screener |

Do not edit these by hand. The backend `export_for_frontend.py` + daily/promote
jobs write them.

## Refresh from the backend

From `dealscope` (sibling repo):

```
python3 export_for_frontend.py
```

Then copy `data/frontend/*.json` into this repo's `data/` folder, except
`news.json`, which the backend's weekly News refresh workflow publishes.
