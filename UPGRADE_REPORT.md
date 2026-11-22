# DealScope upgrade report

22 November 2026. Branch `pro-upgrade` in two repos. Nothing was merged or deployed to production, and no data file was changed.

| Repo | Branch from | Local worktree |
|---|---|---|
| `ram-vp/dealscope-frontend` | `main` at `5fb1052` | `~/Downloads/Vibe Coded Projects/dealscope-pro-upgrade` |
| `ram-vp/dealscope` (backend) | `main` at `c7ea667` | `~/Downloads/Vibe Coded Projects/dealscope-backend-pro-upgrade` |

## Read this first

**The live site is showing wrong numbers today, and stays that way until you merge both branches.**

### Merge in this order

1. **Frontend first.** The validator on today's `main` rejects the corrected backend export (margin coverage 98% to 90%; reproduced). If the backend goes first, every daily price release fails until the frontend catches up.
2. **Backend second.**
3. **Run two workflows by hand** in `ram-vp/dealscope` > Actions: *Quarterly data refresh* (fundamentals are a quarter behind; otherwise the next run is 16 December) and *News refresh* (nothing new since 20 July).

### What will happen when you merge

- Merging the frontend deploys production.
- Within an hour the bot's sweep closes stale PR #99 and deletes its branch. Its 18 Nov prices are older than what is live. **Don't merge #99 by hand: it would roll prices back.** The commit stays reachable from the closed PR.
- Health issue #131 then closes itself on the next watchdog run.
- **77 companies lose their composite score, 64 of them in Financial Services (HDFC Bank, SBI, ICICI).** Their scores were built on a fake 0% margin. They now have one real factor, and the rule needs two. See decision 1.
- Dependabot starts opening weekly update PRs.
- Commits carry a `Co-Authored-By: Claude` trailer and your `main` has none. GitHub copies trailers into squash messages, so delete that line in the merge box if you want to keep it that way.

### Preview

- In a browser signed in to Vercel: <https://dealscope-frontend-git-pro-upgrade-ram-vp.vercel.app> (it redirects to Vercel login otherwise, so I could not test the hosted preview; all testing ran on local production builds).
- Locally:

```bash
cd ~/Downloads/"Vibe Coded Projects"/dealscope-pro-upgrade
pnpm install && pnpm build && pnpm start   # http://localhost:3000
```

The preview uses today's data, so it hides the fake zeros but still has last quarter's fundamentals, the frozen P/E and peer percentiles ranked against those zeros. Those three correct themselves after steps 2 and 3.

Your original `dealscope-frontend` and `dealscope` checkouts were left as they were. Both predate a history rewrite on GitHub: **don't push branches from them.**

## Scores before and after

Lighthouse 13.6, median of 5, local production builds, same harness and data.

| Page | Mobile performance | Mobile LCP | Desktop performance | Accessibility (mobile) | Page weight |
|---|---|---|---|---|---|
| Home | 58 to **100** | 6.5s to **0.9s** | 97 to **100** | 96 to **100** | 4,817 to **326 KB** |
| Results (deep link) | 59 to **81** | 6.6s to **5.0s** | 97 to **99** | 94 to **100** | 4,827 to **622 KB** |
| Tear sheet (deep link) | 60 to **80** | 6.5s to **5.1s** | 97 to **98** | 100 to **100** | 4,824 to **645 KB** |
| About | 99 to **100** | 0.8s to **0.8s** | 100 to **100** | 98 to **100** | 938 to **334 KB** |

- CLS is 0 on all four. SEO is 100 before and after (Lighthouse did not detect the canonical bug or the empty HTML).
- Best Practices is 96 before and after locally: the analytics script only exists on Vercel, so it 404s here.
- **Two targets missed:** deep-linked results and tear sheets on simulated slow-4G mobile are 80 to 81 (target 90) with LCP near 5s (target 2.5s). Client-side screening needs the company list (about 280 KB) before it can draw. See decision 6.

| Check | Before | After |
|---|---|---|
| axe violations, 4 widths, 2 themes | 3,642 contrast nodes + 4 other rules | 0 |
| Smallest text | 4.3px | 12px |
| Dependency advisories | 41 (5 critical, 21 high) | 0 |
| Frontend tests | 172 assertions in scripts | 80 Vitest tests + 186 browser tests |
| Backend tests | 13 files | 15 files, 325 assertions |
| CI | typecheck + tests | lint, types, tests, build, e2e, axe, Lighthouse, audit, backend parity |

## Bugs fixed

### Why data wasn't updating

| # | Bug | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 1 | Fundamentals a quarter behind | Pull ran on the 1st of Jan/Apr/Jul/Oct, before results are filed | Monthly on the 16th; watchdog limit 40 days | Full live pull in scratch: 2,373/2,381 updated, gate passed |
| 2 | A broken pull could publish as a success | Empty Yahoo answers counted as OK; >25% failure exited 0 into auto-promotion | Both fail the run | Unit tests |
| 3 | News and filings frozen since 20 July | No workflow existed; the script skipped companies that already had news; the bot rejected `news.json` | Weekly job that merges and never wipes | Live smoke run (newest item 22 Nov); push + validator rehearsed on temp repos |
| 4 | PR #99 stuck since 18 Nov | Merge gave up after 40s of `mergeable=UNKNOWN`; the sweep skipped any branch with an open PR | Proceed to the real merge test; sweep retries or closes | Sweep script run against temp repos in 3 scenarios |
| 5 | "Prices as of" showed market holidays (20 Oct, 10 Nov) | Stamped with the run date | Last NSE session from index history | Returned 20 Nov when run on Sunday 22 Nov |
| 6 | Insider holding never refreshed | Not in the refresh field list | Added | Unit test |
| 7 | A red Tests run on every data release | Bot deleted the branch before the run started | Path filter, so no run is created | actionlint; needs a real bot PR to confirm |
| 8 | Watchdog ignored timeouts | Only checked `failure` | Retries timeouts and startup failures | Unit test |
| 9 | Daily job started up to 8h late | Scheduled on the congested top of the hour | 11:37 UTC | Needs a few days of real runs to confirm |

### Wrong numbers

| # | Bug | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 10 | 182 companies showed 0.0% EBITDA margin and were scored on it | Yahoo sends 0 for "not applicable" | Null at source, in the gate, validator and UI | Confirmed at the live source; tests in both repos |
| 11 | P/E stale (928 were >10% from cap / earnings) | Frozen at the quarterly pull | Market cap / net income | TCS 16.66 and Reliance 22.70 now equal the live source |
| 12 | P/E shown for 58 loss-making or near-zero earners | Feed ratio passed through | Null | Band counts reconcile exactly |
| 13 | Margins contradicting their own EBITDA / revenue | Feed inconsistency | Recomputed from the definition | Unit test |
| 14 | P/B frozen between pulls | Never moved with price | Rescaled daily | Unit test |
| 15 | Band files could differ from exported data | Computed from a separately loaded frame | Same cleaned frame | Export test |
| 16 | Bad data could reach the JSON | No check before writing | Export validator writes nothing on any violation; frontend validator extended | 13 rejection tests + validator tests |
| 17 | Score rationale contradicted the score (410 of the 451 quoting one) | AI text written in August | Written from live numbers and current weights | Checked for every company |
| 18 | AI summaries quoted stale financials (1,608 of 2,216) | Same; 204 of 262 checkable revenues were wrong | Sentences with figures are dropped | Test over every shipped summary |
| 19 | 49 tiny revenue and debt values shown as ₹0; negatives as ₹-280 | Rounding and formatting | `< ₹1 Cr`, `-₹280 Cr` | Unit test, crawl |
| 20 | US$ deal values used lakh grouping | Wrong locale | en-US | Code review |

### Broken features

| # | Bug | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 21 | `M&M`, `L&T`, `LT`, typos and nonsense listed all 2,381 companies | No-match fell back to the whole universe | Ranked matches, or none | Unit + e2e |
| 22 | 127 companies not findable by their own name | Tata Steel and Sun Pharma parsed as screens | Company lookup before parsing | All 2,381 tested by name and ticker |
| 23 | Match count ignored the name search | Counted before text narrowing | Counts what is listed | e2e |
| 24 | Changing a band dropped typed industries | Two copies of industry state | Pickers get the union | e2e |
| 25 | Picking a sector forgot the typed name | Query text cleared | Keeps the name part | Code review |
| 26 | Shared links lost custom weights | Not in the URL | `w=` parameter | Unit + e2e |
| 27 | `?ticker=tcs` didn't open | Case-sensitive | Case-insensitive | e2e |
| 28 | Back from a tear sheet lost your place | State lived in the unmounted view | Restored | Code review |
| 29 | Homepage HTML was empty for crawlers | Client-side bailout under an overlay | Server-rendered | No-JS e2e |
| 30 | `/about` claimed to be the homepage | Inherited canonical | Per-route metadata | e2e |
| 31 | Search terms and tickers sent to analytics | Full URL reported | Query stripped | Code review (`beforeSend` can't run off Vercel) |

### False or misleading statements

| # | Was | Now |
|---|---|---|
| 32 | Unknown pledge shown as "Unencumbered" (121 companies) | "Not reported" |
| 33 | EV/EBITDA card labelled Enterprise Value, "median multiples" | Equity value, P25 to P75 |
| 34 | EV/EBITDA notes shown under P/E, in backend field names | Each card explains itself |
| 35 | "85 means 85th percentile" for the composite (only 1.5% score 85+) | True of factors; the composite is an average |
| 36 | "Over 85% have zero pledge" (it wasn't) | Computed from the data |
| 37 | Formula said "+ Cash"; holdings "directly from regulatory filings" | Matches the code; Yahoo proxy disclosed |
| 38 | Peers "by correlation" | By factor profile (it is a distance) |
| 39 | Radar drew missing factors as 0 and labelled companies from guesses | Omitted; "Incomplete factor data" |
| 40 | One date shown for both market cap and fundamentals | Both dates |

### How numbers are kept honest from now on

- `backend-parity.test.ts` re-derives every percentile (except leverage, whose cash input isn't exported), valuation range and band edge for every company.
- The backend tests every exported company against its scoring engine.
- `numbers.spec.ts` compares rendered tear sheets with the JSON.
- CI compares the site's data with the backend's nightly.
- Final crawl: 2,381 tear sheets, 169 filter lists and 8 presets with 0 mismatches and 0 errors. Repeated on the fresh Q2 pull with the same result.

## Not fixed, and why

| Item | Why |
|---|---|
| About 52 possible duplicate deals (HDFC merger three times, Mindtree three times, Air India, BillDesk) | Some are real tranches. Needs your judgement, and you said not to delete data |
| Promoter pledge has no refresh job | The only fetcher is an archived NSE scraper, untested from CI runners |
| "Promoter holding" is Yahoo insider holding (HDFC Bank reads 0.15%) | Needs a shareholding-pattern source. Disclosed; the CSV header is unchanged because its 30 columns are locked |
| AI summaries not regenerated | Needs your API keys |
| News relevance (social posts, namesakes) | Name-based Google News matching. Disclosed |
| P/E for two dual-class companies, and ratios for INFY and HCLTECH | No per-class or INR earnings in the feed; the feed's ratio is kept |
| Extreme but possible values (growth of 1,922,000% on a tiny base) | Not provably wrong; flagged by the quality report |
| CSP still has `script-src 'unsafe-inline'` | Hashes and SRI were tested; removing it means giving up static pages. Event handlers, eval and third-party origins are blocked |
| No root `loading.tsx` | It hid prerendered pages until JS ran (caught by test). Data states use skeletons |
| No error monitoring | Needs an account and a DSN |

### Not tested

- The changed workflows have never run on their real triggers (schedule, bot push, news publish). Watch the first run of each.
- Safari, Firefox, real phones, screen readers and field Core Web Vitals. Axe at zero is not a WCAG certification.

## What changed, by area

| Area | Change |
|---|---|
| Dependencies | Next 16.4.6, patched transitives, one-day release-age policy |
| SEO | SSR home, per-route metadata, JSON-LD, sitemap, robots, manifest |
| States | 404, error, global error, skeletons, retry |
| Legal | Privacy (DPDP), Terms, Disclaimer (SEBI), global footer |
| Accessibility | Skip link, landmarks, focus traps, combobox, AA tokens, 12px floor, 44px targets |
| Performance | Lazy compact universe, 256 detail shards, three animation libraries removed, scoped image optimizer |
| Security | HSTS, COOP, tighter CSP, security.txt (expires 21 Nov 2027; CI warns 30 days before by failing), CSV formula guard, safe links |
| Testing and CI | Vitest, Playwright, axe, Lighthouse budget, parity, audit, Dependabot |
| Design system | Primitives, tokens, tear sheet split into 9 files, `docs/DESIGN_SYSTEM.md` |

Judgement calls you may not expect:

- Your second request put the backend, the data bot and the validator in scope, so those are edited.
- Tests pinned to daily-changing values now derive from the data. Some are looser as a result (for example, "holding populated on >85%" in place of exactly 2,257).
- The watchdog test "88 days is fine" was changed to the monthly cadence.
- Smooth-scroll inertia and the animated grain are gone.

## Left for you to decide

1. **How to score banks.** Options: leave unscored (current), or add ROE as a factor for Financial Services. That is a methodology change, so I didn't make it.
2. **Legal review, especially SEBI.** The Research Analyst rules cover "research analysis" and "opinion concerning securities" made available to the public. Scores plus implied value ranges may fall inside that, and a disclaimer may not cure it. Ask a securities lawyer. The legal pages are drafts written from secondary summaries, not legal advice.
3. **Contact identity.** The legal pages and security.txt use your name and personal Gmail. The privacy page commits you to answering grievances within 90 days.
4. **Duplicate deals.** Review the list above.
5. **GitHub repo homepage** points to `dealscope-frontend.vercel.app`, which returns 404. Change it to `dealscope-screener.vercel.app`.
6. **Per-company pages** (`/company/TCS`) would fix deep-link mobile LCP and make 2,381 companies indexable.
7. **Branch protection.** `main` requires no checks. Consider requiring Tests, with an exception for the bot.

## Skills installed

Global, for Claude Code: `web-design-guidelines` and `vercel-react-best-practices` (vercel-labs), `accessibility`, `seo` and `best-practices` (addyosmani), `web-perf` (cloudflare). The first three were loaded and used. SEO, security and performance were checked with Lighthouse and tests directly.

## Sources for the legal pages

- [DPDP Rules 2025 phased commencement (Legal 500)](https://www.legal500.com/intelligence/india/privacy/india's-digital-personal-data-protection-act-and-the-dpdp-rules-2025-phased-commencement-core-obligations-and-a-board-ready-compliance-strategy)
- [DPDP Rules timeline to 13 May 2027 (Legismith)](https://legismith.com/dpdp-rules-2025-timeline/)
- [PIB note on the DPDP Rules](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf)
- [Rights-request workflow under DPDP (Taxmann)](https://www.taxmann.com/post/blog/data-principal-rights-request-workflow-dpdp)
- [SEBI Research Analysts FAQs, 2025 (Lakshmikumaran & Sridharan)](https://www.lkslaw.com/insights/articles/key-clarifications-under-the-sebi-issued-faqs-2025)
- [SEBI Research Analysts amendment, 2025](https://www.sebi.gov.in/legal/regulations/aug-2025/securities-and-exchange-board-of-india-research-analysts-amendment-regulations-2025_95990.html)
- [Vercel Web Analytics privacy](https://vercel.com/docs/analytics/privacy-policy)
