#!/bin/sh

# Update desktop database for .desktop file changes
# This makes the application appear in application menus and registers its capabilities.
if command -v update-desktop-database >/dev/null 2>&1; then
  echo "Updating desktop database..."
  update-desktop-database -q /usr/share/applications
else
  echo "Warning: update-desktop-database command not found. Desktop file may not be immediately recognized." >&2
fi

# Refresh the icon cache. Without this, shells that read the cache (and themes
# layered over hicolor) may keep showing a placeholder until the user logs in
# again.
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  echo "Updating icon cache..."
  gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

# Update MIME database for custom URL schemes (x-scheme-handler)
# This ensures the system knows how to handle your custom protocols.
if command -v update-mime-database >/dev/null 2>&1; then
  echo "Updating MIME database..."
  update-mime-database -n /usr/share/mime
else
  echo "Warning: update-mime-database command not found. Custom URL schemes may not be immediately recognized." >&2
fi

exit 0
