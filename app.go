package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

type App struct {
	ctx           context.Context
	auditLog      *AuditLog
	binaryService *BinaryService
	config        *AppConfig
	dataDir       string
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dataDir, err := appDataDir()
	if err != nil {
		log.Printf("failed to get app data dir: %v", err)
		dataDir = "."
	}
	a.dataDir = dataDir
	if err := os.MkdirAll(a.dataDir, 0o700); err != nil {
		log.Printf("failed to create app data dir: %v", err)
	}

	config, err := LoadConfig(a.dataDir)
	if err != nil {
		log.Printf("failed to load config: %v", err)
		config = DefaultConfig()
	}
	a.config = config
	a.binaryService = NewBinaryService(a.dataDir)

	al, err := NewAuditLog(a.dataDir)
	if err != nil {
		log.Printf("failed to init audit log: %v", err)
	}
	a.auditLog = al
}

func appDataDir() (string, error) {
	switch runtime.GOOS {
	case "linux":
		base := os.Getenv("XDG_DATA_HOME")
		if base == "" {
			home, err := os.UserHomeDir()
			if err != nil {
				return "", err
			}
			base = filepath.Join(home, ".local", "share")
		}
		return filepath.Join(base, "adbkit"), nil
	case "windows":
		base := os.Getenv("APPDATA")
		if base != "" {
			return filepath.Join(base, "adbkit"), nil
		}
	case "darwin":
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Library", "Application Support", "adbkit"), nil
	}

	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "adbkit"), nil
}

func (a *App) Greet(name string) string {
	return "Hello " + name + ", It's show time!"
}
