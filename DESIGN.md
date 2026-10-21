---
version: "1.0.0"
world_id: "obsidian-enterprise-density"
color_space: "oklch"
tokens:
  colors:
    surface:
      canvas: "oklch(16% 0.015 250)"
      card: "oklch(22% 0.02 250)"
      card_elevated: "oklch(26% 0.025 250)"
      sidebar: "oklch(14% 0.015 250)"
      header: "oklch(16% 0.015 250 / 0.95)"
      backdrop: "oklch(10% 0.01 250 / 0.75)"
    text:
      primary: "oklch(96% 0.005 250)"
      secondary: "oklch(80% 0.015 250)"
      muted: "oklch(65% 0.02 250)"
      inverse: "oklch(16% 0.015 250)"
    accent:
      primary: "oklch(75% 0.16 210)"
      light: "oklch(85% 0.12 210)"
      glow: "oklch(75% 0.16 210 / 0.15)"
    state:
      danger: "oklch(55% 0.22 25)"
      success: "oklch(68% 0.16 150)"
      warning: "oklch(78% 0.18 70)"
    border:
      subtle: "oklch(28% 0.02 250)"
      card: "oklch(32% 0.025 250)"
      accent: "oklch(75% 0.16 210 / 0.45)"
  typography:
    fonts:
      editorial: "'Plus Jakarta Sans', -apple-system, sans-serif"
      body: "'Plus Jakarta Sans', -apple-system, sans-serif"
      mono: "'JetBrains Mono', monospace"
    scale:
      xs: "0.75rem"
      sm: "0.875rem"
      base: "1.000rem"
      lg: "1.125rem"
      xl: "1.250rem"
      2xl: "1.500rem"
      3xl: "1.875rem"
      4xl: "2.250rem"
  shape:
    radii:
      none: "0px"
      xs: "2px"
      sm: "4px"
      md: "6px"
      lg: "8px"
      full: "9999px"
    border_widths:
      hairline: "1px"
      focus: "2px"
  shadows:
    sm: "0 1px 2px oklch(10% 0.01 250 / 0.25)"
    card: "0 2px 4px oklch(10% 0.01 250 / 0.35)"
    hover: "0 4px 12px oklch(10% 0.01 250 / 0.45)"
    drawer: "-4px 0 24px oklch(10% 0.01 250 / 0.65)"
  layout:
    max_width: "1680px"
    sidebar_width: "260px"
    gutters:
      page: "24px"
      layout: "16px"
      panel: "12px"
      nested: "8px"
      compact: "4px"
---

# Design System Specification: Obsidian Enterprise Density

## 1. Visual World Architecture
The **Obsidian Enterprise Density** visual system is engineered for high-throughput project governance, technical telemetry, and executive command dashboards:
- **Obsidian Dark Canvas**: Deep cool slate surfaces eliminate eye fatigue during extended multi-hour delivery sessions.
- **Controlled High-Density Grid**: 4pt micro-step grid with active pixel fill factor $\eta_{\text{fill}} \ge 85\%$.
- **Tabular Figures & Telemetry**: Numeric metrics, task IDs (`53.ACT.xxx`), timestamps, and Git hashes render strictly in tabular monospace (`JetBrains Mono`).

## 2. Spatial Layout Primitives (`spatial_layout_primitives.css`)
Layouts are constructed exclusively from standardized spatial primitives:
1. `.tsy-stack`: Vertical cadence distribution with deterministic gap tokens (`data-gap="panel|layout|page"`).
2. `.tsy-cluster`: Horizontal tag and button distribution with defensive flex-wrap.
3. `.tsy-split`: Asymmetric split views (`data-ratio="golden|main-side|1-1"`).
4. `.tsy-subgrid-card-deck`: Multi-column cards with CSS Subgrid track synchronization across header, body, and footer.
- **Component Layout Agnosticism**: Reusable components (`.card`, `.btn`, `.chip`, `.table`) declare `margin: 0`. Spacing is strictly governed by parent primitives.
- **Anti-Blowout Defensive Invariant**: All layout slots declare `min-inline-size: 0; min-width: 0; box-sizing: border-box;`.

## 3. Component Inventory & Interactive Contracts

### 3.1 Primary Action Button (`.btn-primary`)
- **Default**: Background `var(--accent-primary)`, Text `var(--text-inverse)`, Padding `8px 16px`, Radius `var(--radius-sm)`, Font weight `600`.
- **Hover**: Background `var(--accent-light)`, Transform `translateY(-1px)`.
- **Active**: Transform `translateY(0px)`.
- **Focus-Visible**: Outline `2px solid var(--accent-light)`, Outline-offset `2px`.

### 3.2 Metric Card (`.metric-card`)
- Surface density $\ge 85\%$, 1px border `var(--border-card)`, zero unconstrained `space-between` voids.
- Single primary metric number with tabular formatting, accompanied by inline trend sparkline or delta badge.

## 4. Layer 0 Mechanical Linting Rules
All UI deliverables must satisfy `layer0_validator.py` ($P = 1$):
- `RULE-L0-MICRO-FITTS`: Interactive touch/click targets $\ge 44\times 44\text{px}$.
- `RULE-L0-MICRO-8PT-GRID`: Spacing must satisfy `mod 8 == 0` or 4px micro-steps.
- `RULE-L0-MICRO-CONTRAST`: WCAG 2.1 AA luminance contrast $\ge 4.5:1$.
- `RULE-L0-MESO-HICKS-LAW`: Max 1 primary CTA per container or drawer.
- `RULE-L0-MESO-RULE-OF-6`: Forms exceeding 6 inputs mandate multi-step steppers or tabs.

---

# SPEC-DESIGN-SYSTEM-LOGO-263: Sovereign Agentic OS & 53.PM Design System & Logo Suite ("Precision Sovereign Geometry")

`[CANARY:AGENTS.md:GOVERNED] · [CANARY:GEMINI.md:GOVERNED]` · **Spec ID**: `SPEC-DESIGN-SYSTEM-LOGO-263` · **Task ID**: `TASK-PM-BRAND-263` · **Date**: 2026-10-21 · **Tier**: Tier 1 Micro-UTOP (`GW-UTOP-01/02`, `GW-P2-STRESS-360-01`)

---

## 1. Executive Purpose & Brand Identity Architecture

`53_PROJECT_MANAGEMENT` and the **Sovereign Agentic OS** require an authoritative, mathematically rigorous visual identity and design system (**"Precision Sovereign Geometry"**) that unifies all 4 operational surfaces (`ItsAPlan`, `Antigravity 2.0`, `Claude Cowork`, `Codex`), executive dashboards (`20_ACTIVE_CONTINUOUS/dashboards/`), CLI telemetry, and reference documentation.

### 1.1 The Logo Concept: The Sovereign Triadic Prism ("The Sovereign Nexus")
The brand mark synthesizes the two foundational axioms of the enterprise architecture (`53.REF.100` & `53.REF.108`):
1. **Outer Precision Hexagonal Shield (`24x24` / `64x64` Golden-Grid)**: Represents deterministic zero-trust containment (`GW-FS-ISOLATION-01`, `P=1` boundary).
2. **The Three-Node Socio-Technical Vertices (`53.REF.100`)**:
   - **Apex Node — `HUM` (Human Intent & Final Accountability — Phương Võ)**: Crowned at the top vertex (`(32, 8)` in `64x64` space) in **Sovereign Amber Gold** (`#F59E0B`), radiating downward governance edges (`H-D` & `H-A`).
   - **Left Base Anchor — `DET` (Deterministic Code Node, $P=1$)**: Anchored at `(12, 46)` in **Verification Emerald** (`#10B981`), represented as a geometric diamond/square lock enforcing invariants, schemas, and cryptographic state transitions.
   - **Right Base Vector — `AGT` (Autonomous Agent Swarm, $P \in (0,1)$)**: Positioned at `(52, 46)` in **Sovereign Sky & Indigo** (`#38BDF8` $\to$ `#818CF8`), dynamically connected via the bidirectional `A-D` Tool & Contract bridge.
3. **Core Crystalline Prism (`H1–H7` Strategy-to-Execution Spine)**: At the centroid `(32, 33)`, seven precision-faceted horizontal/chevron strata converge into a luminous core, symbolizing the cascade from `H1 Strategic Initiatives` down to `H7 Work Packages` (`205/205` crystallized capabilities).

### 1.2 Brand Lockup & Typography
- **Primary Lockup**: `[Sovereign Nexus Mark]  ACCORD // 53.PM` with subtitle `AGENTIC OS · P=1 GOVERNED HARNESS`.
- **Display & UI Sans**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (tight tracking `-0.02em` on headings, `tabular-nums` on all metrics).
- **Technical Telemetry & Code Mono**: `'JetBrains Mono', 'Fira Code', Consolas, monospace` (used for Gate IDs `GW-*`, Horizon codes `H1..H7`, SHA-256 digests, and $P=1$ badges).

---

## 2. Upfront Pre-Mortem Stress Test & 360-Degree Multi-Lens Review (`GW-P2-STRESS-360-01`)

### 2.1 Pre-Mortem Stress Test (Adversarial Failure Modes)
- **FM-1 (Optical Collapse at `16x16` Favicon Scale)**:
  - *Risk*: Intricate 7-horizon internal facets blur into mud at `16x16` browser tab resolution.
  - *Mitigation*: Provide a dedicated optically-tuned `favicon.svg` that preserves the outer hexagonal shield, bold `3px` triadic edges, and high-contrast `HUM` (Amber), `DET` (Emerald), and `AGT` (Sky) nodes while omitting sub-pixel micro-facets.
- **FM-2 (Theme Inversion Contrast Failure)**:
  - *Risk*: Switching between Dark Obsidian (`#060A12`) and Light Editorial Paper (`#F8FAFC`) causes low contrast on Sky/Amber badges or muted text.
  - *Mitigation*: Define dual-mode semantic tokens in `design-tokens.css` (`:root` Dark Obsidian default + `[data-theme="light"]` Editorial Paper override) where text/badge foregrounds automatically shift to deep high-contrast hues (`#0369A1` Sky-700, `#047857` Emerald-700, `#B45309` Amber-700) in Light Mode to guarantee WCAG AA/AAA ($\ge 4.5:1$ to $14.8:1$).
- **FM-3 (Highcharts CDN Blackout)**:
  - *Risk*: Primary CDN blocked or offline.
  - *Mitigation*: Enforce `GW-CHART-FAILOVER-01` (`jsDelivr` v11.4.8 $\to$ `cdnjs` v11.4.8 $\to$ `.svg-fallback` with `.chart-canvas` collapse).

### 2.2 360-Degree Multi-Lens Feedback
- **`HUM` Lens (Phương Võ)**: Demands zero-fluff executive clarity, unmistakable distinction between Human Authority (`TIER 2`), Deterministic Code (`P=1`), and Agent Autonomy (`P ∈ (0,1)`), and immediate visual cohesion across all dashboards.
- **Beneficiary / User Lens**: Interactive Brand Book allows one-click copying of any CSS variable, hex code, or SVG snippet, plus live state simulation of the animated logo (`IDLE`, `WAVE RUNNING`, `P=1 GATE VERIFYING`, `SEALED ✓✓`, `TIER 2 HITL ESCALATION`).
- **Peer `AGT` Lens**: W3C-structured `20_ACTIVE_CONTINUOUS/design_system/tokens.json` serves as the single programmatic SSOT for all dashboard generator scripts.
- **Security & `DET` Lens ($P=1$)**: Zero external network calls required for SVG logos or CSS tokens; deterministic file generation and SHA-256 verification.

---

## 3. Deliverables & MinTC Acceptance Criteria (`GW-UTOP-02`)

1. **`DoD-1` (`TC-BRAND-263-01`) — Production SVG Logo Suite**:
   - `20_ACTIVE_CONTINUOUS/design_system/assets/logo-mark.svg` (`64x64` primary triadic crystalline mark)
   - `20_ACTIVE_CONTINUOUS/design_system/assets/logo-lockup-dark.svg` (`320x64` full horizontal lockup for dark surfaces)
   - `20_ACTIVE_CONTINUOUS/design_system/assets/logo-lockup-light.svg` (`320x64` full horizontal lockup for light/print surfaces)
   - `20_ACTIVE_CONTINUOUS/design_system/assets/logo-monochrome.svg` (`64x64` single-color currentColor architectural mark)
   - `20_ACTIVE_CONTINUOUS/design_system/assets/favicon.svg` (`32x32` optically simplified high-contrast mark for `16px`/`32px` tabs)
   - `20_ACTIVE_CONTINUOUS/design_system/assets/logo-animated-state.svg` (`64x64` CSS-animated live telemetry mark for agentic execution states)
2. **`DoD-2` (`TC-BRAND-263-02`) — Canonical Design Tokens (`tokens.json` & `design-tokens.css`)**:
   - Complete token taxonomy: `color.surface.*`, `color.node.{hum,det,agt}`, `color.horizon.{h1..h7}`, `color.semantic.{success,warning,danger,info}`, `typography.*`, `spacing.*`, `radius.*`, `elevation.*`.
3. **`DoD-3` (`TC-BRAND-263-03`) — Interactive Brand Book & Design System Showcase HTML**:
   - `20_ACTIVE_CONTINUOUS/dashboards/design_system_brand_book.html` generated by `scripts/generate_design_system_brand_book.py`.
4. **`DoD-4` (`TC-BRAND-263-04`) — Live Dashboard Ecosystem Integration**:
   - Wire `../design_system/design-tokens.css` and the inline Sovereign Nexus SVG logo + Brand Book navigation link into `h1_h7_realtime_agent_swarm_dashboard.html`, `agentic_control_tower_dashboard_2026_10_21.html`, and `index.html`.
5. **`DoD-5` (`TC-BRAND-263-05`) — Headless Playwright & Pytest Verification**:
   - `tests/test_design_system_brand_book.py` validates all 6 SVGs, token schemas, WCAG contrast ratios ($\ge 4.5:1$), Highcharts triple failover, and headless Playwright interaction across all Brand Book views with `0` console errors.

---

## 4. Iteration 2 Overhaul (`TASK-PM-BRAND-264`): Swiss-Grid Minimalist Logo Standard (Anti-Slop Industrial Geometry)

### 4.1 Forensic Rejection of Diagrammatic AI Clichés
The initial logo iteration violated industrial logo design principles by rendering a literal diagram (balls, boxes, connecting lines, a dashed ring, and 7 rainbow lines inside a hexagon). Under **Gate `GW-UIUX-01` (Anti-Slop Logo Invariant)**, the following elements are permanently banned from all brand marks:
1. **Zero Ball-and-Stick Node Graphs**: `<circle>` vertices connected by `<line>` strokes are prohibited in brand marks.
2. **Zero Dashed Orbital Rings**: `stroke-dasharray` inside logo marks is prohibited.
3. **Zero Multi-Color Rainbow Fill Soup**: Mixing Amber, Emerald, Cyan, Violet, and Pink inside the primary mark is prohibited. Semantic colors belong strictly to UI status pills and telemetry charts.
4. **Zero Raw System `<text>` Wordmarks**: Brand lockups must use custom-engineered geometric `<path>` vector letterforms.

### 4.2 The 4-Concept Swiss Geometric Mark Suite
All four marks obey the **Paul Rand / Pentagram 1-Bit Silhouette Law** (100% solid filled `<path>`/`<polygon>` geometry with `stroke="none"`, razor-sharp negative-space channels, and pure Titanium/Obsidian tonal planes):

1. **Concept 01 (Primary Crowned Mark) — *The Sovereign Tri-Blade Monolith***:
   - Three interlocking isometric parallelogram blades arranged in exact $120^\circ$ ($C_3$) rotational pinwheel symmetry around a crisp **negative-space equilateral triangle** at the center `(128, 128)`.
   - Tonal Titanium Bevel: Top Blade `#F8FAFC` (100% Titanium White), Left Blade `#CBD5E1` (Cool Platinum), Right Blade `#64748B` (Anodized Slate) with a subtle `#38BDF8` ice-edge specular accent, set on a continuous-curve Obsidian Squircle (`#090D16`, `rx="56"`).
2. **Concept 02 — *The Kinetic Aperture (S-Prism)***:
   - Two heavy brutalist geometric chevrons sheared at $45^\circ$, interlocking around a negative-space diamond aperture.
3. **Concept 03 — *The Isometric Hex-Vault***:
   - An architectural impossible hexagonal monolith constructed from three continuous L-beams enclosing a hollow isometric core.
4. **Concept 04 — *The Rams Cantilever***:
   - International Typographic Style stepped geometric blocks ascending on an 8-unit Swiss grid.


## Brand Identity & USP Tagline (`TASK-PM-BRAND-267`)
- **Brand Name**: `ACCORD` (Pure 6-letter Swiss geometric `<path>` vector wordmark)
- **USP Tagline**: `"AI Speed. Deterministic Proof. Zero Babysitting."`
