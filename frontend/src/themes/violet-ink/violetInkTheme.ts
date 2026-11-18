import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'
import { palette } from './palette.generated'

/**
 * Violet Ink — ADBKit's own theme. Warm neutral graphite canvases with a
 * violet accent (replaces the legacy blue #65aeff). Extends the maintained
 * neutral theme; only overrides what changes.
 *
 * Domain tokens (terminal, logcat, chart, glow, traffic-light) are published
 * as localTokens so app CSS can consume them via var(--terminal-bg) etc.
 * regardless of the active theme.
 */
export const violetInkTheme = defineTheme({
  name: 'violet-ink',
  extends: neutralTheme,
  color: {
    accent: ['#6653ca', '#8b7cf4'],
    neutralStyle: 'warm',
    contrast: 'standard',
  },
  radius: { base: 12, multiplier: 1.25 },
  motion: { character: 'expressive', tempo: 1.1 },
  typography: {
    body: {
      family: 'Google Sans Flex Variable',
      fallbacks: 'system-ui, sans-serif',
    },
    code: {
      family: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  },
  tokens: {
    // Keep generated roles connected to the accepted palette.
    // --color-accent is the DEEP fill (buttons, chips): white label on it is
    // 5.75:1 (AA). --color-text-accent / --color-icon-accent are the BRIGHT
    // tone for text, icons, and active indicators on dark surfaces (7.07:1
    // on card). M3 tonal split: fill and text cannot be one color here —
    // the deep fill alone fails 3:1 against the dark card as text.
    '--color-accent': [palette.violet.light[45], palette.violet.light[45]],
    '--color-on-accent': ['#FFFFFF', '#FFFFFF'],
    '--color-text-accent': ['#5B46BA', palette.violet.dark[70]],
    '--color-icon-accent': ['#5B46BA', palette.violet.dark[70]],
    // Override the neutral theme's blue accent-muted (leaked #0082fb33).
    '--color-accent-muted': ['rgba(102,83,202,0.16)', 'rgba(165,157,255,0.20)'],
    // Warm graphite canvases (dark-first app).
    '--color-background-body': ['#F7F4EF', '#12100E'],
    '--color-background-surface': ['#FFFFFF', '#1A1714'],
    '--color-background-card': ['#FFFFFF', '#211D19'],
    '--color-background-popover': ['#FFFFFF', '#262119'],
    '--color-background-muted': ['#EDE9E1', '#2A2620'],
    '--color-text-primary': ['#1C1B19', '#F2EEE8'],
    '--color-text-secondary': ['#6E675E', '#A9A19A'],
    '--color-border': ['rgba(0,0,0,0.10)', 'rgba(255,255,255,0.10)'],
    '--color-border-emphasized': ['rgba(0,0,0,0.14)', 'rgba(255,255,255,0.16)'],
    // Status (kept close to the legacy hues so device states read the same).
    '--color-success': ['#16A34A', '#2FBF71'],
    '--color-warning': ['#D97706', '#E8A33D'],
    '--color-error': ['#DC2626', '#E5484D'],
    '--color-info': ['#0E7490', '#22B8D4'],
  },
  localTokens: {
    // Terminal — a distinct island surface, darker than the app in dark mode,
    // lighter in light mode.
    '--terminal-bg': ['#EDEBE6', '#0B0A0D'],
    '--terminal-surface': ['#E3E1DB', '#08070A'],
    '--terminal-text': ['#3A3833', '#DEDBD4'],
    '--terminal-muted': ['#6E675E', '#8F8A82'],
    '--terminal-border': ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.12)'],
    // Logcat levels.
    '--logcat-verbose': ['#6E675E', '#8F8A82'],
    '--logcat-debug': ['#6E675E', '#8F8A82'],
    '--logcat-info': [palette.violet.light[45], palette.violet.dark[60]],
    '--logcat-warn': ['#D97706', '#E8A33D'],
    '--logcat-error': ['#DC2626', '#E5484D'],
    '--logcat-fatal': ['#991B1B', '#F16A6E'],
    // Monitor charts.
    '--chart-primary': [palette.violet.light[45], palette.violet.dark[60]],
    '--chart-secondary': ['#16A34A', '#2FBF71'],
    '--chart-tertiary': ['#D97706', '#E8A33D'],
    // Low-opacity state glows (running indicators only).
    '--glow-info': ['rgba(102,83,202,0.35)', 'rgba(139,124,244,0.35)'],
    '--glow-success': ['rgba(22,163,74,0.35)', 'rgba(47,191,113,0.35)'],
    '--glow-warning': ['rgba(217,119,6,0.35)', 'rgba(232,163,61,0.35)'],
    '--glow-error': ['rgba(220,38,38,0.35)', 'rgba(229,72,77,0.35)'],
    // Decorative macOS window dots on terminal chrome.
    '--traffic-light-red': '#ff5f56',
    '--traffic-light-yellow': '#ffbd2e',
    '--traffic-light-green': '#27c93f',
  },
  components: {
    // Collapsed nav rail: 16px glyphs read as specks in a 56px rail.
    icon: {
      'size:sm': { width: '20px', height: '20px' },
    },
    // The collapsed rail defaults to 48px (--spacing-12) — too tight for a
    // 20px glyph plus its hit area.
    'side-nav': {
      base: { width: '56px' },
    },
  },
})
