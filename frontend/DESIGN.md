# ADBKit Frontend Design System

Source of truth for the ADBKit desktop UI. Everything here is derived from
`frontend/src/index.css` and the components in `frontend/src/components/ui/`.
If code and this document disagree, fix the code or update this document in
the same commit.

---

## 1. Identity

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

## 2. Color

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

## 3. Typography

- Family: Google Sans Flex Variable (`@fontsource-variable/google-sans-flex`),
  loaded in `index.css`, applied globally via `html { @apply font-sans }`.
- Mono: `font-mono` stack for command output, logcat, terminal, version
  strings, and meta figures.
- Weights: 400 (body), 500 (emphasis/labels), 600 (headings, strong text).
  Nothing above 600.
- Tracking: `-0.02em` on large headings only, `-0.01em` on medium headings,
  none below that. No wide tracking on labels, no uppercase transforms.
- Numbers: `tabular-nums` (`.github-star-count` sets the example) and one
  format per screen.
- Sizes come from `clamp()` per context (hero `3rem→4.75rem`, section
  `1.9→3rem`, sub-headings `1.35→2rem`). Keep the existing clamps.

## 4. Spacing and radius

- 4px grid everywhere. Section rhythm is uniform: `6rem 0` vertical padding
  for every page section (`.section`, `.download-section`, `.download-help`,
  `.final-cta`, `.download-hero`, `.donate-hero`).
- Panels/cards: `p-4`–`p-6`. Page edges: `site-container`.
- Radius is derived from `--radius: 0.75rem`:
  `sm .6× / md .8× / lg 1× / xl 1.4× / 2xl 1.8× / 3xl 2.2× / 4xl 2.6×`.
- `rounded-full` is reserved for pills: action bars, chips, avatars, badges,
  search inputs, and the dock. Cards and panels use `rounded-xl`/`rounded-2xl`.

## 5. Elevation

Three shadow tiers, theme-aware, defined once in `index.css`:

| Token | Tier | Use |
|---|---|---|
| `--shadow-card` | flat+ | cards, small controls |
| `--shadow-raised` | raised | info cards, raised panels |
| `--shadow-floating` | floating | dock, dialogs, command palette, popovers, transfer overlay |

Rules:

- App components must use these tokens (`shadow-[var(--shadow-card)]` etc.).
  Tailwind `shadow-md/lg/xl` are allowed only inside `components/ui/`
  primitives where shadcn defaults live.
- Inset shadows (`inset 0 1px 2px ...`) are control details (inset input
  wells), not elevation — they are exempt.
- Blur (`backdrop-blur`) only on Floating tier. Never blur inside
  virtualized lists.
- Dark theme depth comes from surface steps and hairlines, not bigger
  shadows.

## 6. Components

Two layers:

1. **Primitives** — `frontend/src/components/ui/` (27 files). 24 shadcn-style
   (alert-dialog, badge, button, card, checkbox, dialog, dropdown-menu,
   input, kbd, label, popover, progress, radio-group, scroll-area, select,
   separator, skeleton, slider, switch, table, tabs, tooltip, alert, avatar)
   plus 3 in-house:
   - `Sparkline` — inline trend, takes `color` (default `currentColor`).
   - `StatTile` — stat card with `valueTone: default | success | warning |
     danger | info`.
   - `toast` — Base UI toast wrapper.
2. **Domain components** — `components/{apps,dashboard,devices,files,
   flasher,layout,logcat,scrcpy,settings,setup,terminal,common}/`. They
   compose primitives and must not re-implement them.

Conventions:

- Variants via `cn()` + `cva`, never string concatenation.
- Buttons: primary `bg-primary text-primary-foreground`, secondary
  `border-border bg-transparent`. Hover = surface change, active =
  `translate-y-px` (already in `button.tsx`).
- Destructive confirmations go through `alert-dialog`.
- Every list surface has empty / loading (skeleton) / error states.
- Route components stay thin; compose domain panels instead of inlining logic.

## 7. Motion

- One engine: `motion/react`. GSAP/Framer-class libraries are not allowed in
  the app (the marketing website is separate and may use GSAP).
- Durations: 150–250ms for feedback and transitions. Easing:
  `[0.16, 1, 0.3, 1]` (or `ease-out` for micro feedback).
- Animate only `transform` and `opacity`. Never width/height/top/left/
  box-shadow/backdrop-filter. Hover = surface change or `scale ≤1.02`;
  press = tiny scale down.
- At most one entrance animation per screen (`hero-rise` pattern is the
  reference: 700ms rise+fade, `both` fill).
- Reduced motion is a contract: every JS animation checks
  `useReducedMotion()`, CSS fallback in `index.css` under
  `@media (prefers-reduced-motion: reduce)` (zero durations). Content must
  never get stuck at `opacity: 0` for reduced-motion users.

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
- Use `shadow-[var(--shadow-*)]` from the three tiers.

**Don't**

- Hardcode zinc/slate/emerald/amber classes — map to semantic tokens.
- Introduce a second state library or animation engine.
- Animate layout properties or animate blur.
- Put accent color on paragraphs or multiple elements per surface.
- Blur inside virtualized lists.
- Store important state in `localStorage` (theme lives in config.json; the
  setup-wizard draft is the only allowed exception).
- Import generated Wails bindings outside `src/services/`.

## 10. Migration status

All hardcoded palette references in app components have been migrated to
semantic tokens (terminal, setup, scrcpy, files, settings, flasher, device
states, logcat tags). Remaining intentional colors:

- File-type category colors in `FileRow.tsx` (functional coding, §2).
- `components/ui/` shadcn defaults (`shadow-sm/md/lg` allowed there).
- Inset control shadows.

If you find a stray zinc/emerald class, map it to the closest token in §2
and delete it rather than adding it back.

## 11. Theming

- Tokens are CSS custom properties. Light values live in `:root`, dark
  overrides in `.dark`. Tailwind v4 `@theme inline` maps them to utilities
  (`bg-card`, `text-muted-foreground`, …).
- Adding a token: define it in `:root` and `.dark`, add a
  `--color-<name>: var(--<name>)` mapping in `@theme inline`, then use
  `bg-<name>` / `text-<name>` utilities.
- Theme switching: `.dark` class on `document.documentElement`, applied by
  `useUIStore`. Persisted in `config.json` (not localStorage).
- After changing tokens, run `bun run build` and visually check light and
  dark on Dashboard, Files, Terminal, and Settings before committing.
