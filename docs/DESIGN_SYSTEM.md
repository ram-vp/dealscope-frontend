# Design system

The look is the original one (`main` at `5fb1052`, 20 Nov 2026), restored on purpose. **Don't restyle it as a side effect
of other work.** Accessibility, performance and refactoring changes must leave screenshots identical.

- Tokens: `app/globals.css`, above the "Nothing below changes how the site looks at rest" line.
- Type: Bebas Neue for display, IBM Plex Mono for labels and data, IBM Plex Sans for prose.
- Pages added later (legal, 404, error) and the footer reuse the original About and toolbar classes
  (`components/site/styles.ts`).
- Drawers use `components/ui/dialog.tsx`, which supplies behaviour only.

## Contracts to keep

- `/` HTML must contain `Prices as of <date>. Fundamentals as of <date>` (data-bot canary, backend watchdog).
- No root `app/loading.tsx`: React then streams prerendered pages hidden until JavaScript runs.
- No raw HTML from data. `dangerouslySetInnerHTML` is only for the boot script and escaped JSON-LD.
