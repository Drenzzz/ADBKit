package file

import (
	"ADBKit/internal/core"
	"context"
	"regexp"
	"sync"
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

var adbProgressPattern = regexp.MustCompile(`\[\s*(\d+)%\]\s*(.*)`)

type Service struct {
	wailsCtx            context.Context
	resolveActiveSerial func(context.Context) (string, error)

	mu         sync.Mutex
	cancelFunc context.CancelFunc
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

func (s *Service) setCancel(fn context.CancelFunc) {
	s.mu.Lock()
	s.cancelFunc = fn
	s.mu.Unlock()
}

func (s *Service) clearCancel() {
	s.mu.Lock()
	s.cancelFunc = nil
	s.mu.Unlock()
}

// CancelTransfer cancels the active file transfer if one is in progress.
func (s *Service) CancelTransfer() {
	s.mu.Lock()
	fn := s.cancelFunc
	s.mu.Unlock()
	if fn != nil {
		fn()
	}
}
