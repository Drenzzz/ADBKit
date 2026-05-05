package main

import "os/exec"

// SetProcGroup attaches the process to a new process group so we can
// kill the entire tree on cancellation (Windows-specific: uses CREATE_NEW_PROCESS_GROUP).
func SetProcGroup(cmd *exec.Cmd) {
	cmd.SysProcAttr = newProcessGroupAttrs()
}
