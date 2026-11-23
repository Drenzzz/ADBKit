# ADBKit Frontend Design System

Source of truth: `src/themes/violet-ink/violetInkTheme.ts` (defineTheme) and its
generated `violet-ink.css`. The app keeps its own utility names on purpose:
the Tailwind bridge (`@astryxdesign/core/tailwind-theme.css`) exposes Astryx
system tokens, and the app's `@theme inline` block in `index.css` is declared
**after** Astryx imports so app utilities (`bg-primary`, `bg-card`,
`text-muted-foreground`, …) keep ADBKit meanings while resolving to Astryx
tokens. Changing the theme re-skins the whole app without renaming classes.

## Color

- Two surfaces tiers: `background` canvas, `background-card` raised.
- Three text roles: primary, secondary, muted. One accent.
- Accent: violet fill `--color-accent` (#6653ca) for primary actions and
  selection; bright text tone `--color-text-accent` / `--color-icon-accent`
  for ink on dark surfaces (M3 tonal split: fill and text are different
  colors). Accent is rare: primary action, active route, focus ring.
- Semantic colors (`success`, `warning`, `error`, `info`) carry meaning only,
  toned `color-mix` down to sit inside the ramp.
- Surfaces stay neutral graphite (`background-body` #F7F4EF / #12100E,
  `background-surface` #FFFFFF / #1A1714). Borders are hairlines
  (foreground at 6-12%). Depth comes from surface steps, not shadows.
- No gradients, glows, colored shadows, or color blobs. Blur only on
  transient overlays (dialogs, palette, sheets) over real content.

## Typography

- Body: Google Sans Flex Variable (`@fontsource-variable/google-sans-flex`).
  Code/meta mono: system mono stack.
- Sizes: dashboard display 32-36px, page title display-1, section 18px,
  labels 15-16px semibold, body 14-15px, meta mono 13px. **Interface text
  floor is 14px**; only mono meta (paths, serials, timestamps, logcat meta)
  may be 13px. Terminal transcript/input/prompt is mono 14px.
- Weights 400/500/600; nothing above 600. Sentence case everywhere; no
  uppercase tracked labels, no italic, no negative tracking below 14px.
- Tailwind bridge caveat: `text-sm`/`text-base`/`text-lg` resolve to
  Astryx tokens (12/14/17px), **not** Tailwind defaults — prefer explicit
  `text-[14px]` / `text-[15px]` / `text-[16px]` in route code.
  `.dashboard-scale` (18px) only enlarges Astryx Text; plain elements need
  explicit sizes.

## Radius and spacing

- 4px grid everywhere; space inside a group is smaller than between groups.
- Radius from theme `radius: { base: 4, multiplier: 1.25 }`: container 15px,
  inner = outer − padding. Route surfaces use `rounded-3xl` (24px), inner
  tiles `rounded-2xl` (16px), controls `rounded-full` pills. Nested radius
  always subtracts padding.
- Padding by density: pages 20px, cards 20px, inset tiles 16px.

## Elevation and motion

- Shadows via `--shadow-card/raised/floating` tokens only in Astryx layers;
  route code prefers tonal steps (`surface-inset` vs `background-card`).
- One engine: `motion/react`. Durations 150-250ms, easing `[0.2, 0.8, 0.2, 1]`.
  Animate `transform`/`opacity` only. Reduced motion is a contract:
  `useReducedMotion()` guard or `motion-reduce:` fallback on every animation;
  entrance tweens are short `ease-out`, no springs.
- No looping motion (pulse/shimmer) on non-live indicators.

## Components

- Astryx only: `Button`, `Dialog`/`DialogHeader`, `AlertDialog`,
  `DropdownMenu` (+Item/Divider), `Popover`, `Selector`,
  `SegmentedControl`, `Switch`, `CheckboxInput`, `TextInput`, `Badge`,
  `Skeleton`, `ProgressBar`, `FieldLabel`, `Toast` (via `lib/toast.tsx`
  bridge), `ScrollableArea`, `Heading`, `Text`, `VStack`/`HStack`.
- In-house patterns (no Astryx primitive): `.m3-surface` section + 18px h3
  (see `components/settings/SettingsSection.tsx`), `m3-inset` tiles
  (15px label + mono 13-14px meta), session/stat rows, rail navigation
  (96px labeled rail in `AppSideNav.tsx`).
- Tabler (`@tabler/icons-react`) is the only icon set, 22px at 1.75 stroke
  in rail, 18px elsewhere.
- Overlay position warnings: Astryx Dropdown/Popover use CSS anchor
  positioning which WebKitGTK renders clipped in some containers; verify in
  the desktop binary, fall back to absolute flyouts if needed.

## Data-viz

- One accent per chart; muted grid; mono tabular labels. Live Monitor and
  Performance telemetry charts draw with care; everything else that shows
  data is a row list.

## Do / Don't

**Do:** use semantic tokens first; keep route components thin and compose
panels; add domain tokens to the theme before using them; gate every
animation behind reduced-motion.

**Don't:** hardcode color/radius heuristics in components (go through
theme); import generated Wails bindings outside `src/services/`; store
state outside zustand; animate width/height/top/left; use uppercase
tracked labels or sub-14px text.

## Residual audit notes (2026-11)

- Backdrop blur persists only on transient overlays 7 files
  (PackageDetailSheet, InstallApkDialog, CommandPalette, RenameDialog,
  RomFlashCard, CommandHistory, FilesPage); no persistent page blur.
- FileRow keeps per-extension icon colors (amber folders, indigo video,
  violet audio, fuchsia images, cyan code, yellow archives, success APKs)
  as an intentional exception per token strategy.
- Theme overrides that must survive regeneration: toast tonal surfaces
  (`components.toast`), side-nav width (`components['side-nav']`), icon
  size (`components.icon`).
