package core

type ScrcpyPreset struct {
	Name    string        `json:"name"`
	Options ScrcpyOptions `json:"options"`
}

type ScrcpyOptions struct {
	MaxSize            int    `json:"max_size"`
	BitRate            int    `json:"bit_rate"`
	MaxFPS             int    `json:"max_fps"`
	AudioBitRate       int    `json:"audio_bit_rate"`
	AudioCodec         string `json:"audio_codec"`
	VideoCodec         string `json:"video_codec"`
	ShowTouches        bool   `json:"show_touches"`
	NoAudio            bool   `json:"no_audio"`
	NoControl          bool   `json:"no_control"`
	StayAwake          bool   `json:"stay_awake"`
	TurnScreenOff      bool   `json:"turn_screen_off"`
	PowerOffOnClose    bool   `json:"power_off_on_close"`
	Fullscreen         bool   `json:"fullscreen"`
	AlwaysOnTop        bool   `json:"always_on_top"`
	DisableScreensaver bool   `json:"disable_screensaver"`
	Rotation           int    `json:"rotation"`
	DisplayID          int    `json:"display_id"`
	TimeLimit          int    `json:"time_limit"`
}

type PreferencesPayload struct {
	Theme             string            `json:"theme"`
	DeviceNicknames   map[string]string `json:"device_nicknames"`
	LogcatBufferLimit int               `json:"logcat_buffer_limit"`
	ScrcpyPresets     []ScrcpyPreset    `json:"scrcpy_presets"`
}

type AppConfigSnapshot struct {
	AdbPath           string            `json:"adb_path"`
	FastbootPath      string            `json:"fastboot_path"`
	ScrcpyPath        string            `json:"scrcpy_path"`
	SetupCompleted    bool              `json:"setup_completed"`
	Theme             string            `json:"theme"`
	BinaryVersions    map[string]string `json:"binary_versions"`
	DeviceNicknames   map[string]string `json:"device_nicknames"`
	LogcatBufferLimit int               `json:"logcat_buffer_limit"`
	ScrcpyPresets     []ScrcpyPreset    `json:"scrcpy_presets"`
}

type RuntimeDiagnostics struct {
	OS               string            `json:"os"`
	Arch             string            `json:"arch"`
	DataDir          string            `json:"data_dir"`
	ConfigPath       string            `json:"config_path"`
	ManagedBinaryDir string            `json:"managed_binary_dir"`
	SetupCompleted   bool              `json:"setup_completed"`
	Theme            string            `json:"theme"`
	BinaryVersions   map[string]string `json:"binary_versions"`
	Capabilities     map[string]bool   `json:"capabilities"`
}
