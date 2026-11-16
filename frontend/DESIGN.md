# ADBKit Frontend Design System

> **Status: SUPERSEDED — in transition.** The app is migrating from the shadcn
> token system to the Astryx design system with a custom "Violet Ink" theme.
> This document describes the legacy system. The new source of truth is being
> built under `src/themes/violet-ink/` and will replace this document at the
> end of the migration (STEP-028). Sections marked **[legacy]** no longer
> describe the code.

Source of truth for the ADBKit desktop UI. Everything here is derived from
`frontend/src/index.css` and the components in `frontend/src/components/ui/`.
If code and this document disagree, fix the code or update this document in
the same commit.

---

## 0. Token Strategy — Astryx migration (active) 

### Why the app keeps its own utility names

The Astryx Tailwind bridge (`@astryxdesign/core/tailwind-theme.css`) exposes
Tailwind utilities from Astryx system tokens. Eleven of those utility names
collide with names this app already uses, with **different meanings**:

| Utility | ADBKit meaning | Astryx meaning |
|---|---|---|
| `bg-primary` | accent fill (button) | text-primary color (as a background) |
| `text-primary-foreground` | text on accent | n/a (text-primary) |
| `bg-secondary` | muted fill | text-secondary color |
| `bg-muted` | muted fill | background-muted |
| `text-muted-foreground` | secondary text | n/a |
| `bg-accent` | subtle hover fill | text-accent color |
| `border-border` | hairline | border (same meaning) |
| `bg-card` | panel surface | background-card (same meaning) |
| `bg-popover` | overlay surface | background-popover (same meaning) |
| `bg-secondary-foreground` | text on muted | n/a |
| `rounded-sm/md/lg/xl` | 0.6×/0.8×/1×/1.4× of 0.75rem | inner/element/container/page |

**Resolution:** the app's `@theme inline` block is declared **after** the
Astryx imports in `index.css`, so the app's mappings win. App utilities
(`bg-primary`, `bg-card`, `text-muted-foreground`, …) keep their ADBKit
meanings but now **resolve to Astryx system tokens**
(`--color-accent`, `--color-background-card`, `--color-text-secondary`, …).
Changing the active Astryx theme therefore re-skins the whole app without
renaming a single utility class.

### Custom components (no Astryx equivalent — stay in-house)

- `Sparkline` — inline trend chart (Live Monitor, PerformancePanel)
- Virtualized lists — `@tanstack/react-virtual` (package table, file table)
- `BottomDock` — the app's signature macOS-style dock
- Icons — Tabler (`@tabler/icons-react`), not the Astryx icon registry

### Domain tokens (terminal, logcat, charts, glow, traffic lights)

These move into the theme as `localTokens` so they follow the active theme.
Until the theme lands they remain defined in `index.css` `:root`/`.dark`.

---

## 1. Identity **[legacy]**

ADBKit is a dense, dark-first desktop workbench for Android device work
(adb, fastboot, scrcpy). The visual language is Apple/macOS-like pro tool:
near-black graphite canvas, one blue accent, medium radius, soft tiered
shadows. Dense but breathable — a workbench, not a SaaS dashboard and not an
iOS app.

- Dark is the primary theme; light is co-equal and must not regress.
- Accent `#65aeff` (oklch ~0.66 0.2 257) marks active, primary, focus, and
  progress states only.
- No gradients as decoration, no glow outside state indicators, no emoji in
  the UI.

## 2. Color **[legacy]**

All colors are OKLCH in `index.css`, hue 265 (cool graphite). Two themes:
`:root` (light) and `.dark`. Never hardcode palette hexes or Tailwind
zinc/slate/emerald classes in components — use semantic tokens.

### Core semantic tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | 0.96 0.003 265 | 0.18 0.004 265 | app canvas |
| `--card` | 1 0 0 | 0.23 0.004 265 | cards, panels |
| `--popover` | 1 0 0 | 0.27 0.005 265 | dialogs, menus, dock |
| `--foreground` | 0.2 0.004 265 | 0.98 0 0 | primary text |
| `--muted-foreground` | 0.45 0.01 265 | 0.71 0.01 265 | secondary text |
| `--border` | black 10% | white 12% | hairlines |
| `--primary` / `--ring` | 0.623 0.214 257 | 0.656 0.196 257 | accent blue |

### Status tokens

| Token | Use |
|---|---|
| `--success` / `bg-success`, `text-success` | connected, done, healthy |
| `--warning` / `bg-warning`, `text-warning` | warnings, unauthorized |
| `--destructive` | errors, destructive confirmations |
| `--info` / `text-info` | tertiary info (log tags, info value tone) |

Device state mapping: connected → `text-success`, unauthorized →
`text-warning`, offline → `text-muted-foreground`, other → `text-info`.

### Domain tokens

Only these domains may carry their own surface colors:

- `--terminal-bg / -surface / -text / -muted / -border` — terminal is a
  distinct surface, darker than the app in dark mode and lighter in light
  mode. Terminal components must use these, never zinc.
- `--logcat-{verbose,debug,info,warn,error,fatal}` — logcat level colors.
- `--chart-primary / -secondary / -tertiary` — monitor charts.
- `--glow-{info,success,warning,error}` — low-opacity state glows (running
  indicators only).
- `--traffic-light-{red,yellow,green}` — decorative macOS window dots on
  terminal chrome.

### File-type category colors

`FileRow.tsx` assigns per-extension icon colors (amber folders, indigo
video, violet audio, fuchsia images, cyan code, yellow archives, success
APKs, destructive documents). This is intentional functional color coding —
keep the pattern, do not migrate these to semantic tokens.

### Rules

- Accent is rare: primary action, active route, focus ring, the one number
  that matters. Never paragraphs, never multiple elements per surface.
- Status colors carry meaning only, toned down to fit the ramp.
- Glow (`--glow-*`) is a state indicator on running badges, not decoration.
- Borders are hairlines (`--border` or foreground alpha 6–12%).

## 3. Typography **[legacy]**

- Family: Google Sans Flex Variable (`@fontsource-variable/google-sans-flex`),
  loaded in `index.css`, applied globally via `html { @apply font-sans }`.
- Mono: `font-mono` stack for command output, logcat, terminal, version
  strings, and meta figures.
- Weights: 400 (body), 500 (emphasis/labels), 600 (headings, strong text).
  Nothing above 600.
- Tracking: `-0.02em` on large headings only, `-0.01em` on medium headings,
  none below that. No wide tracking on labels, no uppercase transforms.
- Numbers: `tabular-nums` and one format per screen.

## 4. Spacing and radius **[legacy]**

- 4px grid everywhere.
- Radius is derived from `--radius: 0.75rem`:
  `sm .6× / md .8× / lg 1× / xl 1.4× / 2xl 1.8× / 3xl 2.2× / 4xl 2.6×`.
- `rounded-full` is reserved for pills: action bars, chips, avatars, badges,
  search inputs, and the dock. Cards and panels use `rounded-xl`/`rounded-2xl`.

## 5. Elevation **[legacy]**

Three shadow tiers, theme-aware, defined once in `index.css`:

| Token | Tier | Use |
|---|---|---|
| `--shadow-card` | flat+ | cards, small controls |
| `--shadow-raised` | raised | info cards, raised panels |
| `--shadow-floating` | floating | dock, dialogs, command palette, popovers, transfer overlay |

## 6. Components **[legacy]**

Two layers:

1. **Primitives** — `frontend/src/components/ui/` (27 files). 24 shadcn-style
   plus 3 in-house: `Sparkline`, `StatTile`, `toast`.
2. **Domain components** — `components/{apps,dashboard,devices,files,
   flasher,layout,logcat,scrcpy,settings,setup,terminal,common}/`. They
   compose primitives and must not re-implement them.

## 7. Motion

- One engine: `motion/react`. GSAP/Framer-class libraries are not allowed.
- Durations: 150–250ms for feedback and transitions. Easing:
  `[0.16, 1, 0.3, 1]` (or `ease-out` for micro feedback).
- Animate only `transform` and `opacity`.
- Reduced motion is a contract: every JS animation checks
  `useReducedMotion()`, CSS fallback in `index.css` under
  `@media (prefers-reduced-motion: reduce)`. Content must never get stuck at
  `opacity: 0` for reduced-motion users.
- During the Astryx migration, prefer Astryx motion tokens
  (`--duration-*`, `--ease-*`) for new CSS transitions; the theme sets
  `character: 'expressive'`.

## 8. Icons

- Tabler (`@tabler/icons-react`) is the only set. Size 16 or 18, stroke 1.5.
- Icons inherit text color (secondary/muted), never their own palette
  color. Exception: `FileRow` file-type category colors (see §2).
- One icon per concept. No icon + emoji mixes.

## 9. Do / Don't

**Do**

- Use semantic tokens first (`bg-card`, `text-muted-foreground`,
  `border-border`).
- Add new domain tokens to `index.css` (both themes) before using them.
- Keep route components thin; compose panels.
- Gate every new animation behind reduced-motion.

**Don't**

- Hardcode zinc/slate/emerald/amber classes — map to semantic tokens.
- Introduce a second state library or animation engine.
- Store important state in `localStorage` (theme lives in config.json; the
  setup-wizard draft is the only allowed exception).
- Import generated Wails bindings outside `src/services/`.

## 10. Migration status

The shadcn → Astryx migration is in progress (branch `ui/redesign`). See
§0 for the active token strategy. This section and the legacy sections above
will be replaced when the migration completes.
