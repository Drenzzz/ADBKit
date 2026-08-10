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

See `ADBKit-v2.0-Planning.md` and `DESIGN.md` for product scope and UI rules.
