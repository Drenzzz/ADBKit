//go:build !windows

package core

import (
	"os/exec"
	"syscall"
)

func ConfigureChildProcess(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
}
