#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

stage_platform_tools() {
  log "Staging Linux platform-tools"
  rm -rf "$ROOT_DIR/build/bin/bin"
  mkdir -p "$ROOT_DIR/build/bin/bin"
  cp -r "$ROOT_DIR/bin/linux" "$ROOT_DIR/build/bin/bin/"
}

create_linux_desktop_file() {
  cat >"$ROOT_DIR/build/ADBKit.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=ADBKit
Comment=A simple, modern GUI for ADB and Fastboot.
Exec=/usr/bin/adbkit
Icon=adbkit
Categories=Utility;
EOF
}

create_nfpm_config() {
  local version="$1"
  cat >"$ROOT_DIR/build/nfpm.yaml" <<EOF
name: "adbkit"
arch: "amd64"
platform: "linux"
version: "${version}"
section: "utils"
priority: "optional"
maintainer: "Drenzzz <realdrenzzz@gmail.com>"
description: "A simple, modern GUI for ADB and Fastboot."
vendor: "Drenzzz"
homepage: "https://github.com/Drenzzz/adb-gui-kit"
license: "MIT"
contents:
  - src: "build/bin/ADBKit"
    dst: "/opt/adbkit/ADBKit"
  - src: "build/appicon.png"
    dst: "/usr/share/icons/hicolor/256x256/apps/adbkit.png"
  - src: "build/ADBKit.desktop"
    dst: "/usr/share/applications/adbkit.desktop"
  - src: "build/bin/bin/"
    dst: "/opt/adbkit/bin/"
  - src: "/opt/adbkit/ADBKit"
    dst: "/usr/bin/adbkit"
    type: "symlink"
depends:
  - libgtk-3-0
  - libwebkit2gtk-4.0-37
  - libayatana-appindicator3-1
EOF
}

build_linux_packages() {
  log "Packaging .deb"
  (cd "$ROOT_DIR" && nfpm pkg -f build/nfpm.yaml --packager deb --target build/bin/)

  log "Packaging .rpm"
  (cd "$ROOT_DIR" && nfpm pkg -f build/nfpm.yaml --packager rpm --target build/bin/)

  log "Packaging .pkg.tar.zst"
  (cd "$ROOT_DIR" && nfpm pkg -f build/nfpm.yaml --packager archlinux --target build/bin/)
}

build_appimage() {
  local appdir linuxdeploy
  appdir="$ROOT_DIR/build/AppDir"
  linuxdeploy="$ROOT_DIR/build/linuxdeploy-x86_64.AppImage"

  rm -rf "$appdir"
  mkdir -p "$appdir/usr/bin" "$appdir/usr/share/applications" "$appdir/usr/share/icons/hicolor/256x256/apps"

  cp "$ROOT_DIR/build/bin/ADBKit" "$appdir/usr/bin/"
  cp -r "$ROOT_DIR/build/bin/bin" "$appdir/usr/bin/"
  cp "$ROOT_DIR/build/ADBKit.desktop" "$appdir/usr/share/applications/ADBKit.desktop"
  cp "$ROOT_DIR/build/appicon.png" "$appdir/usr/share/icons/hicolor/256x256/apps/adbkit.png"

  sed -i 's|Exec=/usr/bin/adbkit|Exec=ADBKit|g' "$appdir/usr/share/applications/ADBKit.desktop"

  if [[ ! -f "$linuxdeploy" ]]; then
    log "Downloading linuxdeploy"
    wget -q -O "$linuxdeploy" "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage"
    chmod +x "$linuxdeploy"
  fi

  log "Packaging AppImage"
  (cd "$ROOT_DIR/build" && ./linuxdeploy-x86_64.AppImage --appdir AppDir --output appimage)
  mv "$ROOT_DIR/build"/ADBKit-*.AppImage "$ROOT_DIR/build/bin/"
}

main() {
  require_cmd go
  require_cmd pnpm
  require_cmd wails
  require_cmd nfpm
  require_cmd wget
  require_cmd sed

  require_file "$ROOT_DIR/bin/linux/adb"
  require_file "$ROOT_DIR/bin/linux/fastboot"
  require_file "$ROOT_DIR/build/appicon.png"

  local version
  version="${ADBKIT_VERSION:-$(cd "$ROOT_DIR" && project_version)}"
  log "Linux builder ready for version ${version}"

  ensure_frontend_dependencies
  build_frontend_assets

  log "Building Linux binary"
  (cd "$ROOT_DIR" && wails build -clean -upx)

  stage_platform_tools
  create_linux_desktop_file
  create_nfpm_config "$version"
  build_linux_packages
  build_appimage

  log "Linux packaging complete"
}

main "$@"
