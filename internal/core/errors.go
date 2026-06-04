package core

import "time"

// OperationStatus represents the current state of an operation.
type OperationStatus string

const (
	StatusIdle     OperationStatus = "idle"
	StatusPending  OperationStatus = "pending"
	StatusRunning  OperationStatus = "running"
	StatusSuccess  OperationStatus = "success"
	StatusError    OperationStatus = "error"
	StatusCanceled OperationStatus = "canceled"
)

// OperationError represents a structured error from any domain operation.
type OperationError struct {
	Operation string `json:"operation"`
	Message   string `json:"message"`
	Detail    string `json:"detail,omitempty"`
	Retryable bool   `json:"retryable"`
}

func (e *OperationError) Error() string {
	if e.Detail != "" {
		return e.Operation + ": " + e.Message + " (" + e.Detail + ")"
	}
	return e.Operation + ": " + e.Message
}

// NewOperationError creates a new OperationError.
func NewOperationError(op, msg, detail string, retryable bool) *OperationError {
	return &OperationError{
		Operation: op,
		Message:   msg,
		Detail:    detail,
		Retryable: retryable,
	}
}

// OperationResult holds the outcome of a completed operation.
type OperationResult struct {
	Success  bool            `json:"success"`
	Output   string          `json:"output,omitempty"`
	Error    *OperationError `json:"error,omitempty"`
	Duration time.Duration   `json:"duration"`
}

// OperationProgress is emitted during long-running operations.
type OperationProgress struct {
	Operation string          `json:"operation"`
	Status    OperationStatus `json:"status"`
	Progress  float64         `json:"progress,omitempty"`
	Message   string          `json:"message,omitempty"`
}

// BinaryStatus describes the readiness state of an external binary.
type BinaryStatus string

const (
	BinaryMissing BinaryStatus = "missing"
	BinaryInvalid BinaryStatus = "invalid_path"
	BinaryReady   BinaryStatus = "ready"
)

// BinaryInfo describes a discovered binary candidate.
type BinaryInfo struct {
	Name    string       `json:"name"`
	Path    string       `json:"path"`
	Source  string       `json:"source"`
	Status  BinaryStatus `json:"status"`
	Version string       `json:"version,omitempty"`
	Reason  string       `json:"reason,omitempty"`
}
