package scrcpy

import (
	"ADBKit/internal/core"
	"context"
	"strings"
	"testing"
)

func TestOptionsToArgsHwDec(t *testing.T) {
	cases := []struct {
		name    string
		hwDec   string
		wantArg string // "" means the flag must be absent
	}{
		{name: "empty defers to scrcpy default", hwDec: "", wantArg: ""},
		{name: "auto is scrcpy default, not sent", hwDec: "auto", wantArg: ""},
		{name: "disabled is sent", hwDec: "disabled", wantArg: "--hwdec=disabled"},
		{name: "vaapi is sent", hwDec: "vaapi", wantArg: "--hwdec=vaapi"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			args := Options{HwDec: tc.hwDec}.ToArgs()
			joined := strings.Join(args, " ")
			if tc.wantArg == "" {
				if strings.Contains(joined, "--hwdec") {
					t.Fatalf("expected no --hwdec flag, got %v", args)
				}
				return
			}
			found := false
			for _, arg := range args {
				if arg == tc.wantArg {
					found = true
				}
			}
			if !found {
				t.Fatalf("expected %q in args, got %v", tc.wantArg, args)
			}
		})
	}
}

func TestStartSession_RejectsUnknownHwDec(t *testing.T) {
	svc := New(context.Background(), nil, nil, nil, nil, nil)
	_, err := svc.StartSession(context.Background(), "", Options{
		HwDec: "cuda-nonsense",
	})
	if err == nil {
		t.Fatal("expected error for unknown hwdec mode")
	}
	opErr, ok := err.(*core.OperationError)
	if !ok {
		t.Fatalf("expected OperationError, got %T: %v", err, err)
	}
	if !strings.Contains(strings.ToLower(opErr.Detail), "cuda-nonsense") {
		t.Fatalf("detail should name the rejected value, got %q", opErr.Detail)
	}
}
