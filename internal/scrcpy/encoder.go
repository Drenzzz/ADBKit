package scrcpy

import (
	"ADBKit/internal/core"
	"context"
	"os/exec"
	"sort"
	"strings"
)

type CodecSupport struct {
	Codec        string `json:"codec"`
	EncoderName  string `json:"encoderName"`
	Hardware     bool   `json:"hardware"`
	Vendor       bool   `json:"vendor"`
	SoftwareOnly bool   `json:"softwareOnly"`
	Recommended  bool   `json:"recommended"`
	AliasOf      string `json:"aliasOf"`
}

type EncoderSupport struct {
	Serial      string         `json:"serial"`
	VideoCodecs []CodecSupport `json:"videoCodecs"`
	AudioCodecs []CodecSupport `json:"audioCodecs"`
}

func (s *Service) GetEncoderSupport(ctx context.Context, serial string) (*EncoderSupport, error) {
	resolvedSerial, err := s.resolveSerial(ctx, serial)
	if err != nil {
		return nil, err
	}

	scrcpyPath, err := s.resolveBinaryPath()
	if err != nil {
		return nil, err
	}

	adbPath, _ := s.resolveADBPath()
	args := []string{"--serial", resolvedSerial, "--list-encoders"}

	cmd := exec.CommandContext(ctx, scrcpyPath, args...)
	core.ConfigureChildProcess(cmd)
	if adbPath != "" {
		cmd.Env = append([]string{}, "ADB="+adbPath)
	}
	out, runErr := cmd.CombinedOutput()
	if runErr != nil {
		return nil, core.NewOperationError(
			"get_scrcpy_encoder_support",
			"Failed to inspect scrcpy encoder support",
			strings.TrimSpace(string(out)),
			true,
		)
	}

	videoCodecs, audioCodecs := ParseEncoderList(string(out))
	return &EncoderSupport{
		Serial:      resolvedSerial,
		VideoCodecs: videoCodecs,
		AudioCodecs: audioCodecs,
	}, nil
}

func ParseEncoderList(output string) ([]CodecSupport, []CodecSupport) {
	videoMap := map[string]CodecSupport{}
	audioMap := map[string]CodecSupport{}
	section := ""

	for _, raw := range strings.Split(output, "\n") {
		line := strings.TrimSpace(raw)
		switch line {
		case "[server] INFO: List of video encoders:":
			section = "video"
			continue
		case "[server] INFO: List of audio encoders:":
			section = "audio"
			continue
		}
		if !strings.HasPrefix(line, "--") {
			continue
		}
		codec, encoderName, support, ok := parseEncoderLine(line)
		if !ok {
			continue
		}
		switch section {
		case "video":
			current, exists := videoMap[codec]
			if !exists || shouldReplaceCodec(current, support) {
				videoMap[codec] = support
			}
		case "audio":
			current, exists := audioMap[codec]
			if !exists || shouldReplaceCodec(current, support) {
				audioMap[codec] = support
			}
		}
		_ = encoderName
	}

	return sortCodecs(videoMap), sortCodecs(audioMap)
}

func parseEncoderLine(line string) (string, string, CodecSupport, bool) {
	parts := strings.Fields(line)
	var codec, encoderName string
	for _, part := range parts {
		switch {
		case strings.HasPrefix(part, "--video-codec="):
			codec = strings.TrimPrefix(part, "--video-codec=")
		case strings.HasPrefix(part, "--audio-codec="):
			codec = strings.TrimPrefix(part, "--audio-codec=")
		case strings.HasPrefix(part, "--video-encoder="):
			encoderName = strings.TrimPrefix(part, "--video-encoder=")
		case strings.HasPrefix(part, "--audio-encoder="):
			encoderName = strings.TrimPrefix(part, "--audio-encoder=")
		}
	}
	if codec == "" || encoderName == "" {
		return "", "", CodecSupport{}, false
	}
	hardware := strings.Contains(line, "(hw)")
	vendor := strings.Contains(line, "[vendor]")
	softwareOnly := strings.Contains(line, "(sw)") && !hardware
	aliasOf := extractAliasTarget(line)
	return codec, encoderName, CodecSupport{
		Codec:        codec,
		EncoderName:  encoderName,
		Hardware:     hardware,
		Vendor:       vendor,
		SoftwareOnly: softwareOnly,
		AliasOf:      aliasOf,
	}, true
}

func extractAliasTarget(line string) string {
	const marker = "(alias for "
	idx := strings.Index(line, marker)
	if idx < 0 {
		return ""
	}
	rest := line[idx+len(marker):]
	end := strings.Index(rest, ")")
	if end < 0 {
		return ""
	}
	return strings.TrimSpace(rest[:end])
}

func codecScore(s CodecSupport) int {
	score := 0
	if s.Hardware {
		score += 4
	}
	if s.Vendor {
		score += 2
	}
	if !s.SoftwareOnly {
		score += 1
	}
	if s.AliasOf != "" {
		score -= 1
	}
	return score
}

func shouldReplaceCodec(current, candidate CodecSupport) bool {
	if codecScore(candidate) != codecScore(current) {
		return codecScore(candidate) > codecScore(current)
	}
	return candidate.EncoderName < current.EncoderName
}

func sortCodecs(entries map[string]CodecSupport) []CodecSupport {
	out := make([]CodecSupport, 0, len(entries))
	for _, entry := range entries {
		out = append(out, entry)
	}
	sort.Slice(out, func(i, j int) bool {
		if codecScore(out[i]) != codecScore(out[j]) {
			return codecScore(out[i]) > codecScore(out[j])
		}
		return out[i].Codec < out[j].Codec
	})
	if len(out) > 0 {
		out[0].Recommended = true
	}
	return out
}
