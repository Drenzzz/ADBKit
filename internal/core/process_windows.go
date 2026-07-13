//go:build windows

package core

import (
	"os/exec"
	"syscall"
)

const createNoWindow = 0x08000000

// ConfigureChildProcess prevents console flashes from ADB, Fastboot, and
// scrcpy while keeping a process group available for cancellation.
func ConfigureChildProcess(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP |
			createNoWindow,
	}
}
