import { Theme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

// Temporary foundation smoke page (STEP-004). Proves the cascade layer order
// is correct: Astryx component styles apply, and Tailwind utility overrides
// via className still win. Delete after the PoC gate.
export default function FoundationCheckPage() {
  return (
    <div data-foundation-check className="flex flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Foundation check</h1>
      <Theme theme={neutralTheme} mode="dark">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <span className="text-sm text-foreground">
            Nested dark theme: this card must use Astryx tokens.
          </span>
          <button
            type="button"
            className="rounded-md bg-primary-container px-3 py-1.5 text-sm text-primary-foreground"
          >
            Tailwind utility on plain button
          </button>
        </div>
      </Theme>
      <p className="text-xs text-muted-foreground">
        If this page renders with readable surfaces in both modes, the layer
        order (reset, theme, base, astryx-base, astryx-theme, utilities) is
        correct.
      </p>
    </div>
  )
}
