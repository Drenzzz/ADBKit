package packagemgr

import (
	"strings"
	"testing"
)

func TestParseDumpsysPermissions_RuntimeAndInstall(t *testing.T) {
	dumpsys := `
Package [com.example.app] (abc):
  userId=10101
  runtime permissions:
    android.permission.CAMERA: granted=false, flags=[ ]
    android.permission.ACCESS_FINE_LOCATION: granted=true, flags=[ USER_SET ]
    android.permission.READ_CONTACTS: granted=true, flags=[ USER_SET|USER_FIXED]
  install permissions:
    android.permission.INTERNET: granted=true
    android.permission.VIBRATE: granted=true
    android.permission.ACCESS_NETWORK_STATE:
`

	parsed := parseDumpsysPermissions(dumpsys)
	if len(parsed) < 5 {
		t.Fatalf("expected >=5 perms, got %d: %+v", len(parsed), parsed)
	}
	// index by name
	m := make(map[string]PackagePermission)
	for _, p := range parsed {
		m[p.Name] = p
	}
	if m["android.permission.CAMERA"].IsGranted {
		t.Fatalf("CAMERA should be false")
	}
	if !m["android.permission.ACCESS_FINE_LOCATION"].IsGranted {
		t.Fatalf("FINE_LOCATION should be true")
	}
	if m["android.permission.CAMERA"].IsRuntime != true {
		t.Fatalf("CAMERA should be runtime")
	}
	if m["android.permission.INTERNET"].IsRuntime == true {
		t.Fatalf("INTERNET should not be runtime")
	}
	if !m["android.permission.INTERNET"].IsGranted {
		t.Fatalf("INTERNET should be granted (install block without explicit flag)")
	}
}

func TestParseDumpsysPermissions_FlagsOptional(t *testing.T) {
	dumpsys := `
  runtime permissions:
    android.permission.POST_NOTIFICATIONS: granted=true
    android.permission.ACCESS_COARSE_LOCATION: granted=false
`
	parsed := parseDumpsysPermissions(dumpsys)
	if len(parsed) != 2 {
		t.Fatalf("expected 2, got %d", len(parsed))
	}
}

func TestParseDumpsysPermissions_DedupGrantedWins(t *testing.T) {
	dumpsys := `
  runtime permissions:
    android.permission.CAMERA: granted=false
    android.permission.CAMERA: granted=true
`
	parsed := parseDumpsysPermissions(dumpsys)
	if len(parsed) != 1 {
		t.Fatalf("expected 1, got %d", len(parsed))
	}
	if !parsed[0].IsGranted {
		t.Fatalf("expected granted to win")
	}
}

func TestParseAppOps_BasicAndTimeTrim(t *testing.T) {
	appopsOut := `
CAMERA: allow; time=+1d2h3m ago
RECORD_AUDIO: ignore; time=+5h ago
SYSTEM_ALERT_WINDOW: deny; time=+2d ago
android:coarse_location: default
Uid mode: COARSE_LOCATION: ignore
Package [com.example.app] Uid mode: FINE_LOCATION: allow
No permissions?
`

	ops, supported := parseAppOps(appopsOut)
	if !supported {
		t.Fatalf("should be supported")
	}
	if len(ops) < 4 {
		t.Fatalf("expected >=4, got %d: %+v", len(ops), ops)
	}
	m := make(map[string]string)
	for _, op := range ops {
		m[op.Name] = op.Mode
	}
	if m["CAMERA"] != "allow" {
		t.Fatalf("CAMERA want allow got %q", m["CAMERA"])
	}
	if m["RECORD_AUDIO"] != "ignore" {
		t.Fatalf("RECORD_AUDIO want ignore got %q", m["RECORD_AUDIO"])
	}
	if m["SYSTEM_ALERT_WINDOW"] != "deny" {
		t.Fatalf("SYSTEM_ALERT_WINDOW want deny got %q", m["SYSTEM_ALERT_WINDOW"])
	}
	if m["COARSE_LOCATION"] != "default" {
		t.Fatalf("COARSE_LOCATION want default got %q", m["COARSE_LOCATION"])
	}
	// Uid mode lines should be skipped
	if _, ok := m["UID"]; ok {
		t.Fatalf("should skip Uid mode lines")
	}
}

func TestParseAppOps_NoOperations(t *testing.T) {
	ops, supported := parseAppOps("No operations.")
	if !supported {
		t.Fatalf("should be supported even when empty")
	}
	if len(ops) != 0 {
		t.Fatalf("expected 0, got %d", len(ops))
	}
}

func TestParseAppOps_EmptyNotSupported(t *testing.T) {
	_, supported := parseAppOps("")
	if supported {
		t.Fatalf("empty should be not supported")
	}
}

func TestValidatePermissionName(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{"android.permission.CAMERA", true},
		{"android.permission.ACCESS_FINE_LOCATION", true},
		{"", false},
		{"a; rm -rf /", false},
		{"perm with space", false},
		{"android.permission.CAMERA`id`", false},
	}
	for _, c := range cases {
		if validatePermissionName(c.in) != c.want {
			t.Fatalf("validatePermissionName(%q)=%v want %v", c.in, !c.want, c.want)
		}
	}
}

func TestValidateAppOpName_Mode(t *testing.T) {
	if !validateAppOpName("CAMERA") {
		t.Fatalf("CAMERA should be valid")
	}
	if !validateAppOpName("SYSTEM_ALERT_WINDOW") {
		t.Fatalf("SYSTEM_ALERT_WINDOW should be valid")
	}
	if !validateAppOpName("android:coarse_location") {
		t.Fatalf("android:coarse_location should be valid")
	}
	if validateAppOpName("bad;rm") {
		t.Fatalf("should reject bad char")
	}
	if !validateAppOpMode("allow") || !validateAppOpMode("deny") || !validateAppOpMode("ignore") || !validateAppOpMode("default") {
		t.Fatalf("allow/deny/ignore/default should be valid")
	}
	if validateAppOpMode("evil") {
		t.Fatalf("evil should be invalid")
	}
}

func TestPermissionLabel_Fallback(t *testing.T) {
	lbl := permissionLabel("android.permission.MY_CUSTOM_FOO_BAR")
	if lbl == "" {
		t.Fatalf("fallback label empty")
	}
	if strings.Contains(lbl, ".") {
		t.Fatalf("fallback should not contain dot: %q", lbl)
	}
}

func TestAppOpLabel_Fallback(t *testing.T) {
	lbl := appOpLabel("SOME_NEW_OP")
	if lbl == "" {
		t.Fatalf("empty")
	}
}
