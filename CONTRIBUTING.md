# Contributing to ADBKit

Thanks for taking the time to improve ADBKit. Bug reports, device testing,
documentation fixes, and focused pull requests are welcome.

ADBKit is a desktop tool for ADB, Fastboot, and scrcpy. Changes should stay
close to those workflows and should explain how they were tested.

## Before you start

- Search existing issues before opening a new one.
- Use the bug or feature template when creating an issue.
- Report security problems privately. See [SECURITY.md](SECURITY.md).
- Do not include device serial numbers, usernames, access tokens, or private
  file paths in logs and screenshots.

## Development setup

### Requirements

- Go 1.25 or later
- Bun
- Wails `v3.0.0-beta.9` CLI
- Platform dependencies required by Wails and your operating system
- ADB, Fastboot, and scrcpy for device-related testing

Linux development also needs GTK4 and WebKitGTK 6. Windows development may
need WebView2 and NSIS for packaging.

### Clone and install

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

## Branches

Create a short-lived branch from `main`:

```text
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

Keep `main` releasable. Do not push directly to `main` or rewrite its history.

## Project conventions

- Backend domain code belongs under `internal/<domain>/`.
- Frontend components should call the backend through `frontend/src/services/`.
- Do not import generated Wails bindings directly from UI components.
- Do not edit `frontend/bindings/` by hand.
- After changing an exported Go service method, regenerate the bindings:

  ```bash
  wails3 generate bindings -clean -ts
  ```

- Do not bundle ADB, Fastboot, or scrcpy binaries in the repository.
- Keep command validation, path validation, and destructive-operation guards
  in place when changing device workflows.

## Checks

Run the relevant checks before opening a pull request:

```bash
make check
go test ./...
```

For the full local check, including the informational coverage command:

```bash
make check-all
```

## Device testing

For ADB, Fastboot, or scrcpy changes, include the following in the pull
request when available:

- Operating system and version
- Device model and Android version
- USB or wireless connection
- ADB, Fastboot, and scrcpy versions
- Whether the workflow uses a rooted device
- The exact command or app flow that was tested

Do not test flashing or wipe changes on a device whose data you cannot restore.

## Pull requests

Keep each pull request focused on one change. The description should explain
what changed, why it changed, and how it was tested.

Include screenshots for frontend changes. For changes involving flashing,
binary downloads, command execution, paths, or permissions, describe the
failure case and the safety behavior as well as the normal case.

A pull request can be merged after the required checks pass and a maintainer
approves it. Reviewers may ask for a smaller scope, additional device testing,
or clearer error handling.

## Commits

Use a short, imperative commit subject. The existing history commonly uses
prefixes such as `feat:`, `fix:`, `docs:`, and `chore:`.

## License

Contributions should be compatible with the project's [MIT License](LICENSE).
