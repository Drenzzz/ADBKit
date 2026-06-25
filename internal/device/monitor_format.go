package device

import (
	"strconv"
	"strings"
	"time"
)

func formatUptime(seconds int64) string {
	if seconds <= 0 {
		return ""
	}

	d := time.Duration(seconds) * time.Second
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60

	if hours >= 24 {
		days := hours / 24
		hours = hours % 24
		return strings.TrimSpace(strings.Join([]string{
			strings.TrimSpace(strconv.Itoa(days) + "d"),
			strings.TrimSpace(strconv.Itoa(hours) + "h"),
			strings.TrimSpace(strconv.Itoa(minutes) + "m"),
		}, " "))
	}

	if hours > 0 {
		return strings.TrimSpace(strings.Join([]string{
			strings.TrimSpace(strconv.Itoa(hours) + "h"),
			strings.TrimSpace(strconv.Itoa(minutes) + "m"),
		}, " "))
	}

	return strings.TrimSpace(strconv.Itoa(minutes) + "m")
}

func formatBytes(bytes int64) string {
	if bytes <= 0 {
		return ""
	}

	const (
		kb = 1024
		mb = kb * 1024
		gb = mb * 1024
	)

	switch {
	case bytes >= gb:
		return strings.TrimSpace(strings.Join([]string{
			strconv.FormatFloat(float64(bytes)/float64(gb), 'f', 2, 64),
			"GB",
		}, " "))
	case bytes >= mb:
		return strings.TrimSpace(strings.Join([]string{
			strconv.FormatFloat(float64(bytes)/float64(mb), 'f', 1, 64),
			"MB",
		}, " "))
	default:
		return strings.TrimSpace(strings.Join([]string{
			strconv.FormatInt(bytes/kb, 10),
			"KB",
		}, " "))
	}
}
