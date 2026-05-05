package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
)

// App is the root struct that aggregates all backend services.
type App struct {
	ctx       context.Context
	auditLog  *AuditLog
	dataDir   string
}

// NewApp creates a new App with all services initialized.
func NewApp() *App {
	return &App{}
}

// startup is called by Wails on application launch.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dir, err := os.UserConfigDir()
	if err != nil {
		log.Printf("failed to get config dir: %v", err)
		dir = "."
	}
	a.dataDir = filepath.Join(dir, "adbkit")
	os.MkdirAll(a.dataDir, 0o755)

	al, err := NewAuditLog(a.dataDir)
	if err != nil {
		log.Printf("failed to init audit log: %v", err)
	}
	a.auditLog = al
}

// Greet returns a greeting (kept for Wails boilerplate compatibility).
func (a *App) Greet(name string) string {
	return "Hello " + name + ", It's show time!"
}
