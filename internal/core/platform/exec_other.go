//go:build !windows

package core

import (
	"os/exec"
	"syscall"
)

// SetProcGroup attaches the process to a new process group so we can
// kill the entire tree on cancellation (Unix: uses SETPGID).
func SetProcGroup(cmd *exec.Cmd) {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.Setpgid = true
}
