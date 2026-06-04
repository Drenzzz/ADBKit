package file

import (
	"ADBKit/internal/core"
	"context"
	"regexp"
	"time"
)

const (
	defaultPath   = "/sdcard/"
	dirType       = "directory"
	regularType   = "file"
	symlinkType   = "symlink"
	otherType     = "other"
	sizeUnknown   = "-"
	sizeDirNone   = "--"

	transferRetries = 3
	transferDelay   = 2 * time.Second

	TransferProgressEvent = "file_transfer_progress"
)

var adbProgressPattern = regexp.MustCompile(`\[\s*(\d+)%\]`)

type Service struct {
	wailsCtx            context.Context
	resolveActiveSerial func(context.Context) (string, error)
}

func NewService(
	wailsCtx context.Context,
	resolveActiveSerial func(context.Context) (string, error),
) *Service {
	return &Service{
		wailsCtx:            wailsCtx,
		resolveActiveSerial: resolveActiveSerial,
	}
}

func (s *Service) requireActiveSerial(ctx context.Context) (string, error) {
	if s.resolveActiveSerial == nil {
		return "", core.NewOperationError("resolve_active_serial", "No active device is available", "active serial resolver is not configured", true)
	}
	return s.resolveActiveSerial(ctx)
}
