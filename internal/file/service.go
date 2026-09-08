package file

import (
	"ADBKit/internal/core"
	"context"
	"regexp"
	"strings"
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
	getBinPath          func() core.BinaryPaths

	mu         sync.Mutex
	cancelFunc context.CancelFunc
}

func NewService(
	wailsCtx context.Context,
	resolveActiveSerial func(context.Context) (string, error),
	getBinPath func() core.BinaryPaths,
) *Service {
	return &Service{
		wailsCtx:            wailsCtx,
		resolveActiveSerial: resolveActiveSerial,
		getBinPath:          getBinPath,
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

// ListSdCards runs `adb shell sm list-volumes` and returns the parsed list of
// currently-mounted storage volumes on the active device.
func (s *Service) ListSdCards(ctx context.Context) ([]SdCard, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return nil, err
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: s.getBinPath().Adb,
		Args:    []string{"-s", serial, "shell", "sm", "list-volumes"},
		Timeout: 10 * time.Second,
	})
	if err != nil {
		return nil, core.NewOperationError("list_sd_cards", "Failed to list storage volumes", err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, core.NewOperationError("list_sd_cards", "Failed to list storage volumes", strings.TrimSpace(result.Stderr), true)
	}

	return ParseSdCardList(result.Stdout), nil
}

// UnblockPath returns honest guidance for recovering access to a blocked remote
// path. It classifies the path, checks whether it is an SD card mount point that
// is currently missing from the volume list, and surfaces the appropriate
// UnblockResult. ADBKit never fabricates a bypass — scoped-storage and
// system-path restrictions are enforced by Android itself.
func (s *Service) UnblockPath(ctx context.Context, remotePath string) (UnblockResult, error) {
	class := ClassifyPath(remotePath)

	if class == PathPublic {
		return UnblockResult{Type: UnblockNotNeeded, Path: remotePath}, nil
	}

	if class == PathSystem {
		return UnblockResult{
			Type:   UnblockNotNeeded,
			Path:   remotePath,
			Reason: "System paths cannot be accessed through File Explorer.",
		}, nil
	}

	cards, err := s.ListSdCards(ctx)
	if err != nil {
		return UnblockResult{}, err
	}

	mountPoint, _ := normalizeRemotePath(remotePath)
	for _, card := range cards {
		if card.MountPoint == mountPoint || strings.HasPrefix(mountPoint, card.MountPoint+"/") {
			return UnblockResult{
				Type:   UnblockNotNeeded,
				Path:   remotePath,
				Reason: "The storage volume is accessible.",
			}, nil
		}
	}

	return UnblockResult{
		Type:   UnblockVolumeMissing,
		Path:   remotePath,
		Reason: "The storage volume holding this path is not currently mounted.",
	}, nil
}
