package main

import (
	"embed"

	"log"
	"os"

	"ADBKit/internal/core"
	appservice "ADBKit/internal/app"
	platform "ADBKit/internal/platform"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// Wails uses Go's `embed` package to embed the frontend files into the binary.
// Any files in the frontend/dist folder will be embedded into the binary and
// made available to the frontend.
// See https://pkg.go.dev/embed for more information.

//go:embed all:frontend/dist
var assets embed.FS

// resolveStartState reads the user's persisted window state synchronously
// from the data directory so the WebviewWindow can be created with the
// correct StartState. Defaults to maximised when no preference exists.
func resolveStartState() application.WindowState {
	dataDir, err := core.ResolveDataDir()
	if err != nil {
		return application.WindowStateMaximised
	}
	switch core.LoadWindowState(dataDir) {
	case core.WindowStateNormal:
		return application.WindowStateNormal
	case core.WindowStateFullscreen:
		return application.WindowStateFullscreen
	default:
		return application.WindowStateMaximised
	}
}

func main() {
	_ = os.Setenv("WEBKIT_DISABLE_COMPOSITING_MODE", "0")
	_ = os.Setenv("GDK_SYNCHRONIZE", "0")
	platform.ConfigureWebKitRenderer()

	service := appservice.NewApp()
	app := application.New(application.Options{
		Name:        "ADBKit",
		Description: "Modern desktop toolkit for ADB, Fastboot, and scrcpy",
		Services: []application.Service{
			application.NewService(service),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "ADBKit",
		Width:            1280,
		Height:           800,
		MinWidth:         1024,
		MinHeight:        720,
		StartState:       resolveStartState(),
		BackgroundColour: application.NewRGBA(27, 38, 54, 255),
		EnableFileDrop:   true,
		Linux: application.LinuxWindow{
			WebviewGpuPolicy: application.WebviewGpuPolicyAlways,
		},
		URL: "/",
	})
	window.OnWindowEvent(events.Common.WindowFilesDropped, func(event *application.WindowEvent) {
		app.Event.Emit(fileDropEvent, event.Context().DroppedFiles())
	})

	err := app.Run()
	if err != nil {
		log.Fatal(err)
	}
}
