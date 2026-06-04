package packagemgr

import (
	"ADBKit/internal/core"
	"context"
	"fmt"
	"strings"
	"sync"
	"time"
)

func (s *Service) ListPackages(ctx context.Context, filterType string) ([]Info, error) {
	scope, err := normalizeFilter(filterType)
	if err != nil {
		return nil, err
	}

	if scope == filterAll {
		userPackages, err := s.listPackagesForScope(ctx, filterUser)
		if err != nil {
			return nil, err
		}

		systemPackages, err := s.listPackagesForScope(ctx, filterSystem)
		if err != nil {
			return nil, err
		}

		merged := make(map[string]Info, len(userPackages)+len(systemPackages))
		for _, pkg := range userPackages {
			merged[pkg.PackageName] = pkg
		}
		for _, pkg := range systemPackages {
			merged[pkg.PackageName] = pkg
		}

		return sortPackages(mapValues(merged)), nil
	}

	packages, err := s.listPackagesForScope(ctx, scope)
	if err != nil {
		return nil, err
	}

	return sortPackages(packages), nil
}

func (s *Service) listPackagesForScope(ctx context.Context, scope Filter) ([]Info, error) {
	filterFlag := packageFilterFlag(scope)

	type queryResult struct {
		packages []Info
		err      error
	}

	results := make(chan queryResult, 2)
	var wg sync.WaitGroup

	for _, enabled := range []bool{true, false} {
		wg.Add(1)
		go func(isEnabled bool) {
			defer wg.Done()
			packages, err := s.queryPackages(ctx, filterFlag, scope == filterSystem, isEnabled)
			results <- queryResult{packages: packages, err: err}
		}(enabled)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	merged := make(map[string]Info)
	for result := range results {
		if result.err != nil {
			return nil, result.err
		}
		for _, pkg := range result.packages {
			merged[pkg.PackageName] = pkg
		}
	}

	return mapValues(merged), nil
}

func (s *Service) queryPackages(ctx context.Context, filterFlag string, isSystemApp bool, isEnabled bool) ([]Info, error) {
	serial, err := s.requireActiveSerial(ctx)
	if err != nil {
		return nil, err
	}

	statusFlag := "-d"
	statusName := "disabled"
	if isEnabled {
		statusFlag = "-e"
		statusName = "enabled"
	}

	args := []string{"-s", serial, "shell", "pm", "list", "packages", statusFlag}
	if filterFlag != "" {
		args = append(args, filterFlag)
	}

	result, err := core.RunCommand(ctx, core.ExecRequest{
		Command: core.BinaryNameAdb,
		Args:    args,
		Timeout: 15 * time.Second,
	})
	if err != nil {
		return nil, core.NewOperationError("list_packages", fmt.Sprintf("Failed to list %s packages", statusName), err.Error(), true)
	}
	if result.ExitCode != 0 {
		return nil, core.NewOperationError("list_packages", fmt.Sprintf("Failed to list %s packages", statusName), strings.TrimSpace(result.Stderr), true)
	}

	return parsePackageListOutput(result.Stdout, isEnabled, isSystemApp), nil
}

func normalizeFilter(filterType string) (Filter, error) {
	switch Filter(strings.ToLower(strings.TrimSpace(filterType))) {
	case filterUser:
		return filterUser, nil
	case filterSystem:
		return filterSystem, nil
	case "", filterAll:
		return filterAll, nil
	default:
		return "", core.NewOperationError("list_packages", "Package filter is invalid", fmt.Sprintf("unsupported filter: %s", filterType), false)
	}
}

func packageFilterFlag(filterType Filter) string {
	switch filterType {
	case filterUser:
		return "-3"
	case filterSystem:
		return "-s"
	default:
		return ""
	}
}

func parsePackageListOutput(output string, isEnabled bool, isSystemApp bool) []Info {
	packages := make([]Info, 0)
	seen := make(map[string]struct{})

	for _, rawLine := range strings.Split(output, "\n") {
		line := strings.TrimSpace(rawLine)
		if !strings.HasPrefix(line, "package:") {
			continue
		}

		name := strings.TrimSpace(strings.TrimPrefix(line, "package:"))
		if name == "" {
			continue
		}
		if _, exists := seen[name]; exists {
			continue
		}

		seen[name] = struct{}{}
		packages = append(packages, Info{
			PackageName: name,
			IsEnabled:   isEnabled,
			IsSystemApp: isSystemApp,
		})
	}

	return packages
}
