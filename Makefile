APP_NAME     := ADBKit
VERSION      := 2.0.0-beta1
VERSION_DEB  := 2.0.0~beta1
VERSION_ARCH := 2.0.0beta1
BUILD_DIR    := build/bin
BINARY       := $(BUILD_DIR)/$(APP_NAME)
PLATFORM     := linux/amd64
DIST_DIR     := dist

.PHONY: dev build build-upx clean lint typecheck check all deb rpm arch appimage frontend-install

# ── Development ──────────────────────────────────
dev:
	wails dev

# ── Core Build ───────────────────────────────────
build:
	wails build -platform $(PLATFORM) -clean

build-upx:
	wails build -platform $(PLATFORM) -clean -upx

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
