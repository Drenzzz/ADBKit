//go:build windows

package core

import "os/exec"

// SetProcGroup attaches the process to a new process group so we can
// kill the entire tree on cancellation (Windows: uses CREATE_NEW_PROCESS_GROUP).
func SetProcGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = newProcessGroupAttrs()
}
