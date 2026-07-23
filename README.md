<div align="center">

<img src="build/appicon.png" alt="ADBKit logo" width="128" height="128" />

# ADBKit

A modern, unified desktop GUI for **ADB**, **Fastboot**, and **scrcpy** — built with [Wails v2](https://wails.io) (Go + React) for native performance and lightweight resource usage.

> Android device management, visualized. From flashing ROMs to mirroring screens, ADBKit brings every terminal-heavy workflow into one structured desktop app.

</div>

---

## Features

**Dashboard**
- Active device summary with editable nicknames
- Quick health overview (battery, storage, RAM, connection state)
- Wireless ADB connect shortcut
- Binary setup status indicator
- Quick actions to all domains

**Device Manager**
- Full device specs (model, codename, Android version, build ID, security patch)
- Reboot actions: System, Recovery, Bootloader, Fastboot
- Device mode detection (ADB / Fastboot / Sideload)
- Live performance monitor (CPU, RAM, network RX/TX, battery, uptime)
- Screenshot quick action

**App Manager**
- Virtualized package list for smooth handling of thousands of packages
- Install APK via file picker or drag-and-drop
- Uninstall, enable/disable, clear data — single or batch
- Pull APK from device to host
- Search, filter (User/System/All), sort (A-Z, Z-A, Size)
- Detailed package info: version, APK size, data size

**File Explorer**
- Directory navigation with breadcrumb
- Push/pull files — single or batch
- Create folder, delete file/folder, rename
- Transfer progress with cancel support
- Storage usage bar
- Search and hidden file toggle

**Flasher**
- Flash single partition with image validation
- Flash ROM folder via Flash Plan (auto-scan, partition mapping)
- A/B slot management (get/set active slot)
- Wipe data with confirmation guardrail
- Sideload ZIP packages
- Custom Fastboot command input with argument sanitization
- **Wake on Fastboot (WOF)** — power-button replacement for devices with a broken/dead power button:
  - Stay Awake While Charging toggle (screen never sleeps on any charger)
  - Wake + Unlock (KEYCODE_WAKEUP + non-secure keyguard dismiss)
  - Continue Boot (`fastboot continue` to exit the bootloader hands-free)
- Extra confirmation for all destructive actions

**Terminal**
- Interactive ADB Shell, ADB Host, and Fastboot Host modes
- Command history with re-execute
- Session output with monospace rendering
- Collapsible Logcat viewer with real-time streaming
- Log filtering by level, tag, and text
- Export logcat to file

**Scrcpy Hub**
- Screen mirror in native window (not embedded)
- Headless recording with timer and file size estimate
- Screenshot capture with preview and save
- Clipboard sync (push/pull between host and device)
- Configurable: resolution, FPS, bitrate, codec, audio, rotation
- Preset management for quick settings switching
- Process exit detection when scrcpy is closed externally

**Binary Manager**
- Auto-detection cascade: config path → system PATH → managed package → common paths
- Managed download for Platform Tools and scrcpy (full folder package, not standalone executable)
- Custom path support via file picker or folder picker
- Version display per binary
- Broken path detection and recovery flow

**Setup Wizard**
- First-run wizard with macOS-style assistant layout
- 4 steps: Welcome → Platform Tools → scrcpy → Summary
- Auto-detect, manual select, or download automatically
- All three binaries (ADB, Fastboot, scrcpy) required to complete setup

**Settings & Auditability**
- Theme toggle (Dark / Light)
- Terminal default mode
- Device sync interval
- Audit log toggle (off by default)
- Audit log viewer with filtering, search, export/import
- Runtime diagnostics (OS, arch, data dir, capabilities)
- Binary Manager integration

---

## Screenshots

Screenshots of each module are available in [here](screenshots/README.md).

---

## Installation

### Windows portable release

Download and run `ADBKit.exe`; no installer is required. Windows 11 normally
includes Microsoft Edge WebView2 Runtime. On Windows 10 or managed machines,
install the Evergreen WebView2 Runtime before launching ADBKit if the app does
not start. Managed binaries and configuration are stored in
`%APPDATA%\adbkit\`.

Official Windows releases are Authenticode-signed. Verify the signer in the
file's Properties > Digital Signatures tab before running it.

1. Go to the [Releases](https://github.com/drenzzz/ADBKit/releases) page
2. Download the latest release for your OS
3. Install or extract the package
4. Run the application

> **Note:** ADBKit requires ADB, Fastboot, and scrcpy binaries. The Setup Wizard will guide you through detection or download on first launch. All three are required — scrcpy is not optional.

---

## Binary Management

ADBKit manages binaries through a detection-first approach:

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | Config path | Previously saved custom path |
| 2 | System PATH | `exec.LookPath()` discovery |
| 3 | Managed package | Downloaded via Setup Wizard |
| 4 | Common paths | OS-specific default locations |

**Managed download** preserves the full release archive structure:

```
~/.local/share/adbkit/bin/
├── platform-tools/
│   ├── adb
│   ├── fastboot
│   ├── lib64/
│   ├── source.properties
│   └── ...
└── scrcpy/
    ├── scrcpy
    ├── scrcpy-server
    ├── scrcpy.1
    └── ...
```

> Standalone executables are not extracted. Supporting files (lib64, scrcpy-server, etc.) are required for full functionality.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Core | [Wails v2](https://wails.io) |
| Backend | Go 1.23 — Domain-package architecture (`internal/<domain>/`) |
| Frontend | React 19 + TypeScript |
| Build | Vite 8 + Bun |
| State | Zustand + TanStack React Query v5 |
| UI | [shadcn/ui](https://ui.shadcn.com) (base-rhea) + Tailwind CSS v4 |
| Animation | [motion](https://motion.dev) (single engine, no GSAP/Lenis) |
| Icons | Lucide React |
| Toast | Sonner |
| Command Palette | cmdk |
| Virtualization | TanStack Virtual v3 |
| Charts | Recharts |
| Validation | Zod |

---

## Building from Source

**Prerequisites:** Go 1.25+, Bun, [Wails CLI](https://wails.io/docs/gettingstarted/installation)

A `Makefile` wraps the common workflows. Run `make` (or `make help`) to list all targets.

```bash
# Check that required tools are installed (go, wails, bun, adb, ...)
make doctor

# Install Go + frontend dependencies
make deps

# Development (hot reload)
make dev

# Production build
make build          # -> build/bin/ADBKit
make build-upx      # UPX-compressed build

# Build then run the binary
make run

# Quality
make lint           # frontend lint
make typecheck      # frontend typecheck
make check          # lint + typecheck

# Packaging (Linux)
make deb rpm arch appimage   # individual packages
make all                     # all packages -> dist/
```

<details>
<summary>Manual (without make)</summary>

```bash
# Install frontend dependencies
cd frontend && bun install && cd ..

# Development
wails dev

# Production build
wails build

# Frontend typecheck
cd frontend && bun run typecheck

# Frontend lint
cd frontend && bun run lint

# Go tests
go test ./...
```

</details>

### Signing Windows releases

The manual `windows-signed-release` GitHub Actions job signs the portable EXE
and verifies it before upload. Configure these repository secrets first:

- `WINDOWS_SIGNING_CERTIFICATE_BASE64`: Base64-encoded PFX certificate.
- `WINDOWS_SIGNING_CERTIFICATE_PASSWORD`: PFX password.

Optionally set the `WINDOWS_TIMESTAMP_URL` repository variable to the RFC 3161
timestamp endpoint supplied by your certificate authority. The PFX must never
be committed to this repository.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Device not found | Enable USB Debugging in Developer Options; install required USB drivers |
| Unauthorized device | Accept the RSA fingerprint prompt on your device screen |
| Wireless ADB not working | Ensure device and computer are on the same network; check IP/port |
| Linux USB access denied | Configure `udev` rules for your device vendor |
| Windows app does not open | Install or repair Microsoft Edge WebView2 Runtime, then launch `ADBKit.exe` again |
| scrcpy exits immediately | Check if `scrcpy-server` exists in the scrcpy package folder; re-download if missing |
| Binary shows "Invalid path" | Binary may be incomplete; re-download via Settings → Binary Manager |
| Setup wizard won't finish | All three binaries (ADB, Fastboot, scrcpy) must be `ready` — none can be skipped |
| Flash operation fails | Ensure device is in Fastboot mode; verify partition name is valid |

---

## Contributing

Contributions are welcome — open an issue or submit a pull request.

---

## License

MIT
