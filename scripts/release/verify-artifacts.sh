#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

assert_contains() {
  local content="$1"
  local needle="$2"
  local label="$3"
  if ! grep -q "$needle" <<<"$content"; then
    fail "$label is missing required entry: $needle"
  fi
}

verify_deb() {
  local pkg listing
  pkg="$(ls "$ROOT_DIR"/build/bin/*.deb | head -n 1)"
  listing="$(ar p "$pkg" data.tar.gz | tar -tz)"
  assert_contains "$listing" "./opt/adbkit/bin/adb" "deb package"
  assert_contains "$listing" "./opt/adbkit/bin/fastboot" "deb package"
}

verify_rpm() {
  local pkg listing
  pkg="$(ls "$ROOT_DIR"/build/bin/*.rpm | head -n 1)"
  listing="$(bsdtar -tf "$pkg")"
  assert_contains "$listing" "/opt/adbkit/bin/adb" "rpm package"
  assert_contains "$listing" "/opt/adbkit/bin/fastboot" "rpm package"
}

verify_arch() {
  local pkg listing
  pkg="$(ls "$ROOT_DIR"/build/bin/*.pkg.tar.zst | head -n 1)"
  listing="$(tar -tf "$pkg")"
  assert_contains "$listing" "opt/adbkit/bin/adb" "arch package"
  assert_contains "$listing" "opt/adbkit/bin/fastboot" "arch package"
}

verify_appimage() {
  local appimage workdir listing
  appimage="$(ls "$ROOT_DIR"/build/bin/*.AppImage | head -n 1)"
  workdir="$ROOT_DIR/build/verify-appimage"

  rm -rf "$workdir"
  mkdir -p "$workdir"
  cp "$appimage" "$workdir/ADBKit.AppImage"
  chmod +x "$workdir/ADBKit.AppImage"

  (cd "$workdir" && ./ADBKit.AppImage --appimage-extract >/dev/null)
  listing="$(cd "$workdir/squashfs-root" && find . -type f)"

  assert_contains "$listing" "./usr/bin/bin/linux/adb" "AppImage"
  assert_contains "$listing" "./usr/bin/bin/linux/fastboot" "AppImage"
}

main() {
  require_cmd ar
  require_cmd bsdtar
  require_cmd tar
  require_cmd find

  verify_deb
  verify_rpm
  verify_arch
  verify_appimage

  log "Artifact verification passed"
}

main "$@"
