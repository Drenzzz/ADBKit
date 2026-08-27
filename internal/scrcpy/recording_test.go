package scrcpy

import (
	"strings"
	"testing"
)

func TestStartRecording_RejectsEmptySerial(t *testing.T) {
	svc := &Service{}
	err := svc.StartRecording("", "/tmp/recording.mp4", Options{})
	if err == nil {
		t.Fatal("expected error for empty serial")
	}
	if !strings.Contains(err.Error(), "Device serial is required") {
		t.Errorf("expected friendly error, got %v", err)
	}
}

func TestStartRecording_RejectsEmptyOutputPath(t *testing.T) {
	svc := &Service{}
	err := svc.StartRecording("ABC123", "", Options{})
	if err == nil {
		t.Fatal("expected error for empty output path")
	}
	if !strings.Contains(err.Error(), "Output file path is required") {
		t.Errorf("expected friendly error, got %v", err)
	}
}

func TestStopRecording_NoActiveRecording(t *testing.T) {
	svc := &Service{}
	_, err := svc.StopRecording()
	if err == nil {
		t.Fatal("expected error when no active recording")
	}
	if !strings.Contains(err.Error(), "No active recording") {
		t.Errorf("expected friendly error, got %v", err)
	}
}

func TestTakeScreenshot_RequiresActiveSession(t *testing.T) {
	svc := &Service{}
	_, err := svc.TakeScreenshot("nonexistent", "/tmp/ss.png")
	if err == nil {
		t.Fatal("expected error for nonexistent session")
	}
}

func TestTakeScreenshot_RejectsEmptyOutputPath(t *testing.T) {
	svc := &Service{}
	_, err := svc.TakeScreenshot("", "")
	if err == nil {
		t.Fatal("expected error for empty output path")
	}
}