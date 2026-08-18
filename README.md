# ADBKit

ADBKit is a desktop toolkit for Android device workflows built around ADB,
Fastboot, and scrcpy. It provides device management, app and file operations,
terminal and logcat tools, ROM flashing, scrcpy control, and binary setup in one
native application.

## Stack

- Wails v3 beta.6 with Go 1.25+
- React 19, TypeScript, Vite, and Bun
- Tailwind CSS v4, shadcn/ui, Zustand, and TanStack libraries
- Generated Wails bindings in `frontend/bindings/`

## Development

Install dependencies:

```bash
go mod download
cd frontend && bun install
```

Run the desktop app with hot reload:

```bash
wails3 dev
```

Build a production executable:

```bash
wails3 build
```

The executable is written to `bin/`.

Run checks:

```bash
cd frontend && bun run typecheck && bun run lint && bun run test && bun run build
cd .. && go test ./...
```

Package for the current platform:

```bash
wails3 package
```

Windows packaging uses the Wails NSIS task and requires `makensis`. Linux
packaging produces AppImage, DEB, RPM, and Arch packages when the platform
toolchain is available.

## Project Layout

- `main.go`: Wails application shell and window configuration
- `app*.go`: root binding facade for product services
- `internal/`: domain services and process integrations
- `events.go`: typed Wails v3 event registration
- `frontend/src/`: product UI, routes, stores, hooks, and service adapters
- `frontend/bindings/`: generated TypeScript bindings; do not edit manually
- `build/`: Wails v3 build, icon, and packaging assets
- `build/config.yml`: application metadata and Wails build configuration

## Runtime Requirements

ADBKit expects ADB, Fastboot, and scrcpy. The setup wizard can detect existing
installations, accept custom paths, or download managed packages. All three
tools are required to finish setup.

See `../ADBKit-v2.0-Planning.md` and `../DESIGN.md` for product scope and UI rules.

## Features

### Dashboard and Devices

- Active device summary and editable device nicknames
- Battery, storage, RAM, connection, and performance overview
- USB and wireless ADB workflows
- Device specifications, mode detection, reboot actions, and screenshots

### App Manager

- Virtualized package list for large device inventories
- Install APK from a picker or native drag-and-drop
- Uninstall, enable, disable, clear data, and batch actions
- Pull APK files, search, filter, sort, and inspect package details

### File Explorer

- Browse device storage with breadcrumbs and hidden-file support
- Push, pull, create, delete, and rename files or folders
- Transfer progress and cancellation support
- Storage usage information

### Flasher

- Flash individual partitions with validation
- Scan and flash ROM folders through a Flash Plan
- A/B slot management and wipe-data guardrails
- Sideload ZIP packages and run validated Fastboot commands
- Wake on Fastboot actions for continue, wake, unlock, and stay-awake flows

### Terminal and Logcat

- Interactive ADB shell, ADB host, and Fastboot host modes
- Command history and session output
- Streaming Logcat with level, tag, and text filters
- Export Logcat output to a file

### Scrcpy Hub

- Native-window screen mirroring
- Recording with timer and size estimate
- Screenshot capture and save
- Clipboard synchronization
- Resolution, FPS, bitrate, codec, audio, rotation, and preset controls

### Binary Manager and Setup Wizard

- Detection order: saved config, system PATH, managed package, and common paths
- Full Platform Tools and scrcpy package management
- Custom binary and directory selection
- First-run setup for ADB, Fastboot, and scrcpy
- All three binaries are required to finish setup

### Settings and Auditability

- Dark and light themes
- Terminal defaults and device sync interval
- Binary Manager integration
- Optional audit logging with search, filtering, export, and import
- Runtime diagnostics for OS, architecture, data directory, and capabilities

## Screenshots

Screenshots for each product area are available in `screenshots/`.

## Installation

For a Windows portable release, run `bin/ADBKit.exe` or download the release
artifact. Windows 11 normally includes WebView2. Install the Evergreen WebView2
Runtime on Windows 10 or managed machines if the app does not start.

ADBKit stores managed binaries and configuration under the platform application
data directory. The setup wizard will guide you through detection, custom paths,
or managed downloads.

## Managed Binary Layout

Managed downloads preserve the full release package instead of extracting only
one executable:

```text
platform-tools/
  adb
  fastboot
  lib64/
  source.properties
scrcpy/
  scrcpy
  scrcpy-server
  scrcpy.1
```

Supporting files are required for complete ADB, Fastboot, and scrcpy behavior.

## Build Commands

The legacy `make` interface is retained as a wrapper around Wails v3 tasks:

```bash
make doctor
make deps
make dev
make build
make windows
make check
make package
make deb rpm arch appimage
```

The canonical commands are `wails3 dev`, `wails3 build`, and `wails3 package`.
Generated bindings belong in `frontend/bindings/` and must be regenerated with
`wails3 generate bindings -clean -ts` after exported Go services change.

## Signing Windows Releases

The `windows-signed-release` CI job signs and verifies the portable executable.
Configure `WINDOWS_SIGNING_CERTIFICATE_BASE64` and
`WINDOWS_SIGNING_CERTIFICATE_PASSWORD` repository secrets. Optionally configure
`WINDOWS_TIMESTAMP_URL`. Never commit the PFX certificate or its password.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Device not found | Enable USB debugging and install the required USB driver. |
| Unauthorized device | Accept the RSA prompt on the device. |
| Wireless ADB fails | Check that both devices share the same network and port. |
| Linux USB access denied | Configure udev rules for the device vendor. |
| Windows app does not open | Install or repair Microsoft Edge WebView2 Runtime. |
| scrcpy exits immediately | Confirm `scrcpy-server` exists in the managed package. |
| Invalid binary path | Re-select or re-download the complete binary package. |
| Setup cannot finish | ADB, Fastboot, and scrcpy must all be ready. |
| Flash fails | Check Fastboot mode and validate the partition name. |

## Contributing

Contributions are welcome. Open an issue or submit a pull request with tests for
behavioral changes.
