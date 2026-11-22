# Design system

Tokens live in `app/globals.css`, primitives in `components/ui/`. Product components use both and never raw colours.

## Colour tokens

Both themes are defined together. Contrast is enforced by `e2e/a11y.spec.ts` (axe, both themes, every view).

| Token | Use |
|---|---|
| `background`, `card` | Surfaces |
| `foreground` | Primary text |
| `muted-foreground` | Secondary text. Never with an opacity suffix: that is what failed AA |
| `accent`, `accent-hover`, `accent-foreground` | Brand orange. The only highlight colour |
| `border` | Decorative rules and card edges |
| `control` | Boundary of anything interactive (3:1) |
| `track` | Ring and bar tracks |

Colour is never the only signal: pressed toggles also show a tick, current nav is underlined.

## Type

| Role | Classes |
|---|---|
| Display | `font-display` (Bebas Neue), `text-3xl` and up |
| Body | `font-sans`, `text-base`, `leading-relaxed` |
| Labels and data | `font-mono`, `text-xs` or `text-sm`, `tabular-nums` for figures |

12px (`text-xs`) is the floor. Don't put text inside a scaling SVG `viewBox`.

## Spacing and targets

- 4px grid. Page gutters `px-4 sm:px-6 md:px-12`. Containers `max-w-7xl` (app), `max-w-3xl` (prose).
- Interactive elements are at least 44x44px (`min-h-11 min-w-11`). Links inside a sentence are exempt.
- No horizontal scrolling rows. Use `MobileDisclosure`.

## Primitives

| Component | Use |
|---|---|
| `Button`, `buttonClass()` | Actions, and links styled as actions. `primary`, `secondary`, `outline`, `ghost` |
| `Toggle` | Anything pressable on/off |
| `Chip` | Static labels only |
| `Dialog` | Every modal: focus trap, Escape, focus restore, safe areas |
| `MobileDisclosure` | Long pill groups on phones |
| `Eyebrow`, `SectionHeader` | Section openers |
| `StatusPage`, `LoadError`, `ViewSkeleton` | Error, retry and loading states |

View changes are links (`AppLink`), not buttons, so new-tab and copy-link work.

## Motion

CSS only, `transform` and `opacity`, 120 to 300ms. `prefers-reduced-motion` is handled globally.

## Icons

Lucide, outline, `aria-hidden` beside text. `BitmapChevron` is the one brand glyph. No emoji or arrow characters as icons.

## Copy

Follow `POSITIONING_MEMO.md`: no em dashes, none of the banned phrases. A number in copy is computed from `data/`, never typed.

## Contracts to keep

- `/` HTML must contain `Prices as of <date>. Fundamentals as of <date>` (data-bot canary, backend watchdog).
- No root `app/loading.tsx`: React then streams prerendered pages hidden until JavaScript runs.
