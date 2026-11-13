#!/bin/sh
# Regenerates the Linux hicolor icon set from build/appicon.png.
# nfpm installs every size so shells and icon themes can pick the right one
# without scaling a single oversized PNG.
#
# This must stay concurrency-safe: `make deb rpm arch appimage-lite` runs the
# packaging tasks in parallel, and each of them calls this script. Never delete
# the output tree, and write each icon through a temp file plus rename, so a
# parallel reader never sees a missing or half-written PNG.
#
# ImageMagick 7 provides `magick`; Debian/Ubuntu still ship 6.x with only
# `convert`, so accept either.
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT_DIR/build/appicon.png"
OUT="$ROOT_DIR/build/linux/icons"
APP_ID="com.drenzzz.adbkit"

if [ ! -f "$SRC" ]; then
  echo "Error: source icon not found at $SRC" >&2
  exit 1
fi

if command -v magick >/dev/null 2>&1; then
  IM="magick"
elif command -v convert >/dev/null 2>&1; then
  IM="convert"
else
  echo "Error: ImageMagick is required (magick or convert) but was not found." >&2
  exit 1
fi

for size in 16 24 32 48 64 128 256 512; do
  dir="$OUT/${size}x${size}/apps"
  mkdir -p "$dir"
  tmp="$dir/.$APP_ID.$$.png"
  "$IM" "$SRC" -resize "${size}x${size}" "$tmp"
  mv -f "$tmp" "$dir/$APP_ID.png"
done

echo "Generated hicolor icon set in $OUT (using $IM)"
