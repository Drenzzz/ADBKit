APP_NAME     := ADBKit
VERSION      := 2.0.0-beta2
VERSION_DEB  := 2.0.0~beta2
VERSION_ARCH := 2.0.0beta2
BUILD_DIR    := build/bin
BINARY       := $(BUILD_DIR)/$(APP_NAME)
PLATFORM     := linux/amd64
DIST_DIR     := dist
# WebKitGTK build tag. Many modern distros ship webkit2gtk-4.1 instead of 4.0;
# override on the CLI if needed:  make dev WEBKIT_TAG=
WEBKIT_TAG   := webkit2_41
WAILS_TAGS   := $(if $(WEBKIT_TAG),-tags $(WEBKIT_TAG),)

.PHONY: help dev build build-upx clean lint typecheck check all deb rpm arch appimage frontend-install deps doctor run

.DEFAULT_GOAL := help

# ── Help ─────────────────────────────────────────
help:
	@echo "$(APP_NAME) $(VERSION) - make targets:"
	@echo ""
	@echo "  Development"
	@echo "    make dev              Run app in dev mode (hot reload)"
	@echo "    make run              Build then run the binary"
	@echo "    make deps             Install Go + frontend deps"
	@echo "    make doctor           Check required tools are installed"
	@echo ""
	@echo "  Build"
	@echo "    make build            Production build ($(PLATFORM))"
	@echo "    make build-upx        Production build, UPX-compressed"
	@echo ""
	@echo "  Quality"
	@echo "    make lint             Lint frontend"
	@echo "    make typecheck        Typecheck frontend"
	@echo "    make check            lint + typecheck"
	@echo ""
	@echo "  Packaging"
	@echo "    make deb rpm arch appimage    Build individual packages"
	@echo "    make all              Build all packages into $(DIST_DIR)/"
	@echo ""
	@echo "  Cleanup"
	@echo "    make clean            Remove build + dist artifacts"

# ── Setup ────────────────────────────────────────
deps: frontend-install
	go mod download

doctor:
	@echo "Checking required tools..."
	@command -v go >/dev/null 2>&1 && echo "  ok  go"     || echo "  MISSING go"
	@command -v wails >/dev/null 2>&1 && echo "  ok  wails"  || echo "  MISSING wails (go install github.com/wailsapp/wails/v2/cmd/wails@latest)"
	@command -v bun >/dev/null 2>&1 && echo "  ok  bun"    || echo "  MISSING bun (https://bun.sh)"
	@command -v adb >/dev/null 2>&1 && echo "  ok  adb"    || echo "  MISSING adb (android-platform-tools)"
	@command -v nfpm >/dev/null 2>&1 && echo "  ok  nfpm"   || echo "  optional: nfpm (deb/rpm packaging)"
	@command -v makepkg >/dev/null 2>&1 && echo "  ok  makepkg" || echo "  optional: makepkg (arch packaging)"
	@command -v upx >/dev/null 2>&1 && echo "  ok  upx"    || echo "  optional: upx (build-upx)"

frontend-install:
	cd frontend && bun install

# ── Development ──────────────────────────────────
dev:
	wails dev $(WAILS_TAGS)

run: build
	$(BINARY)

# ── Core Build ───────────────────────────────────
build:
	wails build -platform $(PLATFORM) $(WAILS_TAGS) -clean

build-upx:
	wails build -platform $(PLATFORM) $(WAILS_TAGS) -clean -upx

# ── Quality ──────────────────────────────────────
lint:
	cd frontend && bun run lint

typecheck:
	cd frontend && bun run typecheck

check: lint typecheck

# ── Packaging ────────────────────────────────────
deb: build
	mkdir -p $(DIST_DIR)
	sed 's/^version: .*/version: "$(VERSION_DEB)"/' nfpm.yaml > /tmp/nfpm-deb.yaml
	nfpm package -p deb -f /tmp/nfpm-deb.yaml -t $(DIST_DIR)/
	rm -f /tmp/nfpm-deb.yaml

rpm: build
	mkdir -p $(DIST_DIR)
	sed 's/^version: .*/version: "$(VERSION_DEB)"/' nfpm.yaml > /tmp/nfpm-rpm.yaml
	nfpm package -p rpm -f /tmp/nfpm-rpm.yaml -t $(DIST_DIR)/
	rm -f /tmp/nfpm-rpm.yaml

arch: build
	cd packaging/arch && sed 's/^pkgver=.*/pkgver=$(VERSION_ARCH)/' PKGBUILD > PKGBUILD.tmp && mv PKGBUILD.tmp PKGBUILD
	cd packaging/arch && makepkg -f --noconfirm

appimage: build
	VERSION=$(VERSION) bash scripts/build-appimage.sh

# ── All ──────────────────────────────────────────
all: deb rpm arch appimage
	@echo "All packages in $(DIST_DIR)/"

# ── Clean ────────────────────────────────────────
clean:
	rm -rf $(DIST_DIR) $(BUILD_DIR)/$(APP_NAME) build/*.deb build/*.rpm
	rm -rf build/pkg packaging/arch/pkg packaging/arch/src packaging/arch/*.pkg.tar.*
	rm -rf build/AppImage-out build/tools
