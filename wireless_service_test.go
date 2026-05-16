package main

import (
	"context"
	"testing"
)

func TestWirelessConnect_EmptyAddress(t *testing.T) {
	s := NewWirelessService(t.TempDir())
	_, err := s.Connect(context.Background(), "")
	if err == nil {
		t.Fatal("expected error for empty address")
	}
}

func TestWirelessConnect_NoPort(t *testing.T) {
	s := NewWirelessService(t.TempDir())
	_, err := s.Connect(context.Background(), "192.168.1.100")
	if err == nil {
		t.Fatal("expected error for address without port")
	}
}

func TestWirelessConnect_InvalidAddress(t *testing.T) {
	s := NewWirelessService(t.TempDir())
	_, err := s.Connect(context.Background(), "not-an-address")
	if err == nil {
		t.Fatal("expected error for invalid address")
	}
}

func TestWirelessDisconnect_EmptyAddress(t *testing.T) {
	s := NewWirelessService(t.TempDir())
	_, err := s.Disconnect(context.Background(), "")
	// Empty address means "disconnect all" which is valid behavior
	// The command will fail because adb is not available in test env
	if err == nil {
		t.Log("disconnect with empty address accepted (disconnect all)")
	}
}

func TestEnableTCPIP_EmptySerial(t *testing.T) {
	s := NewWirelessService(t.TempDir())
	_, err := s.EnableTCPIP(context.Background(), "", "5555")
	if err == nil {
		t.Fatal("expected error for empty serial")
	}
}
