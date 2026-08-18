package app

import (
	"ADBKit/internal/core"
	"fmt"
	"strings"
	"time"
)

func (a *App) isAuditEnabled() bool {
	if a.cfg == nil {
		return false
	}
	return a.cfg.AuditEnabled
}

func (a *App) logOperationSuccess(operation, message string, startedAt time.Time) {
	if a.auditLog == nil || !a.isAuditEnabled() {
		return
	}
	a.auditLog.LogOperation(operation, message, time.Since(startedAt).String(), true)
}

func (a *App) logOperationFailure(operation string, err error, startedAt time.Time) {
	if a.auditLog == nil || !a.isAuditEnabled() || err == nil {
		return
	}
	a.auditLog.LogOperationWithDetails(
		operation,
		buildAuditFailureMessage(operation, err),
		buildAuditFailureDetails(err),
		time.Since(startedAt).String(),
		false,
	)
}

func buildAuditFailureMessage(operation string, err error) string {
	if opErr, ok := err.(*core.OperationError); ok && opErr.Message != "" {
		return opErr.Message
	}
	return fmt.Sprintf("%s failed", strings.ReplaceAll(operation, "_", " "))
}

func buildAuditFailureDetails(err error) string {
	if opErr, ok := err.(*core.OperationError); ok {
		parts := make([]string, 0, 2)
		if strings.TrimSpace(opErr.Detail) != "" {
			parts = append(parts, opErr.Detail)
		}
		return strings.TrimSpace(strings.Join(parts, " | "))
	}
	return err.Error()
}

func auditAction[T any](a *App, operation string, action func() (T, error)) (T, error) {
	startedAt := time.Now()
	result, err := action()
	if err != nil {
		a.logOperationFailure(operation, err, startedAt)
		return result, err
	}
	a.logOperationSuccess(operation, fmt.Sprintf("%s completed", strings.ReplaceAll(operation, "_", " ")), startedAt)
	return result, nil
}

func auditVoidAction(a *App, operation string, action func() error) error {
	startedAt := time.Now()
	if err := action(); err != nil {
		a.logOperationFailure(operation, err, startedAt)
		return err
	}
	a.logOperationSuccess(operation, fmt.Sprintf("%s completed", strings.ReplaceAll(operation, "_", " ")), startedAt)
	return nil
}
