<p align="center">
  <img src="build/appicon.png" alt="ADBKit icon" width="96">
</p>

<h1 align="center">ADBKit</h1>

<p align="center">A desktop toolkit for Android device work with ADB, Fastboot, and scrcpy.</p>

<p align="center">
  <a href="https://github.com/Drenzzz/ADBKit/stargazers">
    <img src="https://img.shields.io/github/stars/Drenzzz/ADBKit?style=flat&amp;logo=github&amp;label=Stars" alt="GitHub stars">
  </a>
  <a href="https://github.com/Drenzzz/ADBKit/issues">
    <img src="https://img.shields.io/github/issues/Drenzzz/ADBKit?style=flat&amp;logo=github&amp;label=Issues" alt="Open GitHub issues">
  </a>
  <a href="https://github.com/Drenzzz/ADBKit/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Drenzzz/ADBKit?style=flat&amp;label=License" alt="MIT license">
  </a>
  <a href="https://github.com/Drenzzz/ADBKit/releases">
    <img src="https://img.shields.io/github/v/tag/Drenzzz/ADBKit?style=flat&amp;label=Latest%20tag" alt="Latest Git tag">
  </a>
  <a href="https://adbkit.netlify.app">
    <img src="https://img.shields.io/badge/Website-adbkit.netlify.app-65aeff?style=flat&amp;logo=netlify&amp;logoColor=white" alt="ADBKit website">
  </a>
  <a href="https://github.com/Drenzzz/ADBKit/actions/workflows/ci.yml">
    <img src="https://github.com/Drenzzz/ADBKit/actions/workflows/ci.yml/badge.svg" alt="CI status">
  </a>
</p>

<p align="center">
  <a href="#supported-platforms">
    <img src="https://img.shields.io/badge/Linux-GTK4%20%2B%20WebKitGTK%206-4c9a2a?style=flat&amp;logo=linux&amp;logoColor=white" alt="Linux with GTK4 and WebKitGTK 6">
  </a>
  <a href="#supported-platforms">
    <img src="https://img.shields.io/badge/Windows%2010%2B-WebView2-0078d6?style=flat&amp;logo=windows&amp;logoColor=white" alt="Windows 10 and later with WebView2">
  </a>
  <a href="#supported-platforms">
    <img src="https://img.shields.io/badge/macOS%2012%2B-build%20config-555555?style=flat&amp;logo=apple&amp;logoColor=white" alt="macOS 12 and later build configuration">
  </a>
</p>

<p align="center">
  <a href="#development">
    <img src="https://img.shields.io/badge/Go-1.25%2B-00ADD8?style=flat&amp;logo=go&amp;logoColor=white" alt="Go 1.25 or later">
  </a>
  <a href="#development">
    <img src="https://img.shields.io/badge/Wails-v3.0.0--beta.9-4b5563?style=flat" alt="Wails v3.0.0 beta.9">
  </a>
  <a href="#development">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&amp;logo=react&amp;logoColor=20232a" alt="React 19">
  </a>
  <a href="#development">
    <img src="https://img.shields.io/badge/TypeScript-7-3178C6?style=flat&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 7">
  </a>
  <a href="#development">
    <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat&amp;logo=vite&amp;logoColor=white" alt="Vite 8">
  </a>
  <a href="#development">
    <img src="https://img.shields.io/badge/Bun-package%20manager-f9f1e1?style=flat&amp;logo=bun&amp;logoColor=14151a" alt="Bun package manager">
  </a>
  <a href="#development">
    <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS v4">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> |
  <a href="#supported-platforms">Platforms</a> |
  <a href="#installation">Installation</a> |
  <a href="#screenshots">Screenshots</a> |
  <a href="#development">Development</a> |
  <a href="#troubleshooting">Troubleshooting</a> |
  <a href="#contributing">Contributing</a>
</p>

ADBKit puts device management, app and file operations, terminal, logcat,
flashing, scrcpy controls, and binary setup in one desktop app. The setup wizard
can find installed tools, use paths you provide, or download managed packages.
ADB, Fastboot, and scrcpy must all be ready before setup can finish.

## Features

### Dashboard and devices

- Select and switch between connected devices.
- View device details, battery, storage, RAM, connection state, and performance.
- Connect over USB or wireless ADB, including the wireless pairing flow.
- Edit device nicknames, take screenshots, detect device modes, and run reboot actions.

### App manager

- Browse installed packages in a virtualized list.
- Install APKs from a picker or drag and drop them into the app.
- Uninstall, enable, disable, clear data, and run batch actions.
- Pull APK files and inspect package details with search, filtering, and sorting.

### File explorer

- Browse device storage with breadcrumbs and hidden-file support.
- Push, pull, create, rename, and delete files or folders.
- See transfer progress and cancel an active transfer.
- View storage usage and jump to mounted external SD cards.
- Get clear guidance when Android blocks a protected or unavailable path.

### Flasher

- Flash individual partitions after validating the target name.
- Scan a ROM folder and review its Flash Plan before writing images.
- Manage A/B slots and use the wipe-data confirmation guardrail.
- Send ZIP files through ADB sideload and run validated Fastboot commands.
- Use Wake on Fastboot actions for continue, wake, unlock, and stay-awake flows.

### Terminal and Logcat

- Use ADB shell, ADB host, and Fastboot host modes.
- Keep command history and session output in the app.
- Stream Logcat and filter by level, tag, or text.
- Export Logcat output to a file.

### Scrcpy

- Start screen mirroring in a native window.
- Record the device screen with a timer and file-size estimate.
- Capture screenshots and save them to the host.
- Synchronize the clipboard between the device and computer.
- Adjust resolution, FPS, bitrate, codec, audio, rotation, and saved presets.

### Setup, settings, and diagnostics

- Detect binaries in saved configuration, the system PATH, managed packages, and common paths.
- Select custom files or directories for ADB, Fastboot, and scrcpy.
- Download and preserve complete Platform Tools and scrcpy packages.
- Switch between dark and light themes and set terminal defaults.
- Persist window state and configure the device synchronization interval.
- Review optional audit logs and runtime diagnostics.

## Supported platforms

| Platform | Requirements | Distribution |
| --- | --- | --- |
| Linux | GTK4 and WebKitGTK 6 | AppImage, DEB, RPM, and Arch packages |
| Windows 10 and later | Microsoft WebView2 Runtime | Portable executable and Wails packaging tasks |
| macOS 12 and later | Platform-specific WebKit support | Build configuration is included; no macOS release artifact is currently published |

Windows 7 is not supported by the v2 application. The Linux `appimage` target
bundles more dependencies for portability. The `appimage-lite` target expects
the host system to provide GTK4, WebKitGTK 6, and their runtime dependencies.

## Installation

Download the package for your platform from the
[ADBKit releases page](https://github.com/Drenzzz/ADBKit/releases), or browse
the [ADBKit website](https://adbkit.netlify.app) for release stats.

### Linux

For an AppImage:

```bash
chmod +x ./ADBKit-<version>-linux-amd64.AppImage
./ADBKit-<version>-linux-amd64.AppImage
```

Package managers can install the files produced for their format:

```bash
sudo apt install ./<deb-file>
sudo dnf install ./<rpm-file>
sudo pacman -U ./<arch-package>
```

### Windows

Run the downloaded `.exe`. Windows 11 normally includes WebView2. On Windows 10
or managed machines, install the Evergreen WebView2 Runtime if ADBKit does not
start.

### First launch

The setup wizard checks for ADB, Fastboot, and scrcpy. It can use an existing
installation, accept a custom path, or download a managed package. The managed
packages keep the supporting files required by ADB, Fastboot, and scrcpy, such
as `lib64/` and `scrcpy-server`.

## Screenshots

Screenshots for the dashboard, devices, app manager, File Explorer, Flasher,
Terminal, Scrcpy, and Settings are in
[`here`](screenshots/README.md).

## Development

### Requirements

- Go 1.25 or later
- Bun
- Wails v3 CLI
- Platform dependencies required by Wails and the target operating system

The repository currently uses Wails `v3.0.0-beta.9`.

Clone the repository and install dependencies:

```bash
git clone https://github.com/Drenzzz/ADBKit.git
cd ADBKit
go mod download
cd frontend
bun install
cd ..
```

Run the app with hot reload:

```bash
wails3 dev
```

Build a production executable. The output is written to `bin/`:

```bash
wails3 build
```

Run the checks used by the project:

```bash
make check
make check-all
go test ./...
```

Package the current platform:

```bash
wails3 package
```

Linux package targets are also available through the Makefile:

```bash
make deb rpm arch appimage
make appimage-lite
```

After changing an exported Go service, regenerate the TypeScript bindings:

```bash
wails3 generate bindings -clean -ts
```

Generated bindings live in `frontend/bindings/`. Do not edit those files by hand.

## Project layout

- `main.go` contains the Wails application shell and window setup.
- `internal/` contains domain services and process integrations.
- `internal/app/` exposes the service facade used by Wails.
- `frontend/src/` contains routes, components, stores, hooks, and service adapters.
- `frontend/bindings/` contains generated TypeScript bindings.
- `build/` contains Wails build, icon, and packaging assets.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Device not found | Enable USB debugging and install the required USB driver. |
| Device is unauthorized | Accept the RSA prompt on the device. |
| Wireless ADB fails | Check the network connection, pairing state, and port. |
| Linux USB access is denied | Configure a udev rule for the device vendor. |
| Windows app does not open | Install or repair Microsoft WebView2 Runtime. |
| Scrcpy exits immediately | Confirm that `scrcpy-server` exists in the managed package. |
| Setup cannot finish | Make sure ADB, Fastboot, and scrcpy are all ready. |
| Flashing fails | Check Fastboot mode and validate the partition name. |

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Drenzzz/ADBKit&type=Date)](https://www.star-history.com/#Drenzzz/ADBKit&Date)

## Contributing

Open an issue for a bug or feature request. Pull requests that change behavior
should include tests for the affected path and pass `make check`.

## License

ADBKit is available under the [MIT License](LICENSE).
