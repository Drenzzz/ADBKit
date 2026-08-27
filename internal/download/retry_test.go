package download

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestFetchRetryOnTransientError(t *testing.T) {
	attempts := 0
	payload := []byte("transient-then-success")
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	destPath := filepath.Join(t.TempDir(), "archive")
	if err := dl.Fetch(context.Background(), srv.URL, destPath); err != nil {
		t.Fatalf("expected retry to succeed, got %v", err)
	}
	if attempts != 3 {
		t.Errorf("expected 3 attempts (2 transient + 1 success), got %d", attempts)
	}
	content, err := os.ReadFile(destPath)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(content, payload) {
		t.Errorf("payload mismatch: got %q", content)
	}
}

func TestFetchFailsFastOn4xx(t *testing.T) {
	attempts := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusNotFound)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	destPath := filepath.Join(t.TempDir(), "archive")
	if err := dl.Fetch(context.Background(), srv.URL, destPath); err == nil {
		t.Fatal("expected 404 to fail")
	}
	if attempts != 1 {
		t.Errorf("expected single attempt for 4xx, got %d", attempts)
	}
}

func TestFetchHonoursContextCancellation(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // already cancelled before we even start

	destPath := filepath.Join(t.TempDir(), "archive")
	if err := dl.Fetch(ctx, srv.URL, destPath); err == nil {
		t.Fatal("expected cancellation error")
	}
}

func TestFetch429Retries(t *testing.T) {
	attempts := 0
	payload := []byte("ok-after-rate-limit")
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 2 {
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write(payload)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	destPath := filepath.Join(t.TempDir(), "archive")
	if err := dl.Fetch(context.Background(), srv.URL, destPath); err != nil {
		t.Fatalf("expected 429 to retry, got %v", err)
	}
	if attempts != 2 {
		t.Errorf("expected 2 attempts, got %d", attempts)
	}
}

func TestFetchTransientBackoff(t *testing.T) {
	attempts := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer srv.Close()

	dl := NewDownloader(nil)
	start := time.Now()
	destPath := filepath.Join(t.TempDir(), "archive")
	_ = dl.Fetch(context.Background(), srv.URL, destPath)
	elapsed := time.Since(start)

	// 2 backoffs of 1s + 2s = 3s minimum between 3 attempts
	if elapsed < 3*time.Second {
		t.Errorf("expected at least 3s of backoff, got %v", elapsed)
	}
	if attempts != maxRetries {
		t.Errorf("expected %d attempts, got %d", maxRetries, attempts)
	}
}
