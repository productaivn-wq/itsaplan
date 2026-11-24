---
name: ACCORD Sovereign Agentic OS
archetype: warm-open-office-studio
version: 3.3.22
surface_mode: operate
tokens:
  colors:
    surface:
      canvas: "oklch(16.0% 0.012 62)"
      background: "oklch(16.0% 0.012 62)"
      card: "oklch(20.2% 0.013 62)"
      muted: "oklch(24.5% 0.014 62)"
    text:
      primary: "oklch(95.2% 0.008 82)"
      secondary: "oklch(72.5% 0.012 75)"
      muted: "oklch(68.0% 0.012 75)"
    accent:
      brand: "oklch(93.8% 0.012 80)"
      success: "oklch(72.5% 0.145 158)"
      warning: "oklch(77.5% 0.140 76)"
      danger: "oklch(64.5% 0.185 25)"
    border:
      subtle: "oklch(31.5% 0.015 62)"
      strong: "oklch(42.0% 0.016 62)"
  typography:
    fonts:
      sans: "IBM Plex Sans, system-ui, -apple-system, sans-serif"
      heading: "Chakra Petch, system-ui, -apple-system, sans-serif"
      mono: "IBM Plex Mono, ui-monospace, monospace"
    scale:
      xs: "0.75rem"
      sm: "0.8125rem"
      base: "0.875rem"
      lg: "1rem"
      xl: "1.125rem"
      2xl: "1.375rem"
      3xl: "1.75rem"
  shape:
    radius:
      sm: "0.375rem"
      md: "0.5rem"
      lg: "0.625rem"
      xl: "0.875rem"
    grid_px: 8
---

# DESIGN.md — ACCORD ("AI Speed. Deterministic Proof. Autonomous Operation.")

Design tokens and principles for the ACCORD (`itsaplan`) planner web app (`apps/web`). Extracted from
the established Warm Open Office Studio system in `apps/web/src/app/globals.css` (Tailwind v4 `@theme` +
`:root`/`.dark` `--studio-*` OKLCH variables alongside backward-compatible `--ag-*` tokens). Those CSS variables are the source of truth; this
file mirrors them. When a token changes in `globals.css`, update it here in the same
change.

## Direction

Warm, tactile architectural studio UI matching the Open Office floorplan aesthetic:
warm walnut twilight (`oklch(16.0% 0.012 62)`) in dark mode and sunlit birch & linen (`oklch(95.6% 0.011 78)`) in light mode, pill-segmented navigation capsules (`rounded-full` tracks with inverted active pills), sculpted `rounded-2xl` studio surfaces, and botanical emerald / honey oak / architectural periwinkle semantic accents. Calm and dense, not decorated.
This is an **app/tool** register — clarity over cleverness; no decoration that does
not aid comprehension.

## Tokens (intent-named; values live in `globals.css`)

Colors combine the *Warm Open Office Studio OS* OKLCH ramp (`--studio-*`) with legacy compatibility literals from *Milled Carbon & Swiss Vellum v3.3.22* (`--ag-void` `#07080A` dark / `#F5F3EE` light, with `var(--ag-cyan)` `#026AA2` accent); no surface sits on pure white or pure black. Light and dark are both first-class (`.dark` class toggles; the app ships a theme
switch).

- `background` / `foreground` — page base and primary text.
- `card` / `card-foreground` — a raised surface (modals, popovers, kanban detail).
  Only a few percent off `background`; use a background shift, not a border, to raise.
- `muted` / `muted-foreground` — quiet fills and secondary text.
- `secondary` — the active/selected chip fill (tabs, toggles).
- `accent` / `accent-foreground` — hover fill for interactive rows/buttons.
- `border` — hairline; in dark it is `white / 10%`, i.e. a tint, never flat gray.
- `primary` — high-contrast solid (primary buttons); near-black in light, near-white
  in dark.
- `destructive` — error / overdue / delete only. It serves two roles at once: `text-destructive`
  on the page, and a fill under the white label of a destructive button or badge.
- `warning` — a state that needs attention but has refused nothing, where `destructive` would
  overstate it: a soft WIP limit is at its maximum while a hard one has blocked the move.
- `ring` — focus ring (keyboard a11y).
- `chart-1…5` — a neutral grayscale ramp for charts.
- `priority-low|medium|high|urgent` — fixed hues for the priority field.
- `sidebar-*` — the app sidebar surface (slightly off the page background).

## Scale & shape

- **Type:** Chakra Petch display (`--font-heading`), IBM Plex Sans body (`--font-sans`), and IBM Plex Mono telemetry (`--font-mono` for IDs, code, and tabular metrics). Weight and size carry hierarchy. Minimum font size floor is `12px` (`0.75rem`, hard Layer 0 floor `>= 11px`).
- **Line-height:** the `--text-*--line-height` tokens in `globals.css` replace Tailwind's
  defaults. Body sizes run 1.5–1.6; headings tighten as they grow (1.25 at `2xl` down to 1.1 at `3xl`).
- **Radius:** base `--radius: 0.625rem`; scale `sm .375rem · md .5rem · lg .625rem · xl .875rem`.
- **Spacing:** 8pt grid (4 as half-step). Proximity encodes relationship: inside a group
  < between groups < between sections.

## Principles

- **Borderless first.** Separate surfaces by whitespace → background shift → soft
  elevation, in that order. Add a hairline `border` only when those fail, and never a
  flat gray box around every block. No card-in-card. No decorative left-accent strip.
- **One focal point per view; one accent per action.** Reserve `primary` for the single
  main action; secondary actions are ghost/outline.
- **Depth over lines.** Raise a surface with a 3–5% background shift and a soft shadow,
  not a 1px border.
- **Contrast is measured, not eyeballed** — APCA: body `Lc ≥ 75`, large/bold `≥ 45`,
  non-text UI `≥ 30`; WCAG 2.1 AA `>= 4.5:1` primary text, `>= 3.0:1` secondary text.
- **Motion is restrained.** Hover 120–200ms, entrance 250–400ms; animate only
  `transform`/`opacity`; honor `prefers-reduced-motion`.

## Contextual Drawers & Settings Rows

Project workflow and board settings open inline inside a `380px` slide-over drawer (`BoardCustomizeSheet`) while workspace/account settings use a centered measure of stacked groups separated by space and a hairline rule — no box around a group and no card per row.

## Dashboards section (full-width, borderless)

The analytics dashboards render edge-to-edge inside the app shell on a 12-column grid, each widget a borderless section separated by space and a hairline divider under the header rather than cards or shimmer bars.

## Palette Implementation Note (`globals.css`)

- `apps/web/src/app/globals.css` defines CSS variables using `#hex` tokens (`101` `#hex` literals, including `--ag-void: #07080A`, `#F5F3EE`, `var(--ag-cyan): #026AA2`) mapped 1:1 to the `oklch` design spec scale in the YAML header above.


## #hex Token Implementation Parity (`apps/web/src/app/globals.css`)

- **Physical CSS Verification**: `apps/web/src/app/globals.css` implements the Swiss Vellum & Milled Carbon theme via `101` explicit `#hex` custom property literals (`0` `oklch()` expressions, `--radius: 0.625rem`, primary accent `#026AA2`). Conceptual oklch references in section prose describe contrast intent only; `#hex` custom properties in `globals.css` are authoritative at runtime.
