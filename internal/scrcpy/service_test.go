package scrcpy

import "testing"

func TestCodecScorePrefersHardware(t *testing.T) {
	hw := CodecSupport{Hardware: true}
	sw := CodecSupport{SoftwareOnly: true}
	if codecScore(hw) <= codecScore(sw) {
		t.Fatalf("expected hardware score higher than software only, got hw=%d sw=%d", codecScore(hw), codecScore(sw))
	}
}

func TestCodecScoreBreaksTiesByName(t *testing.T) {
	a := CodecSupport{EncoderName: "OMX.beta"}
	b := CodecSupport{EncoderName: "OMX.alpha"}
	if shouldReplaceCodec(a, b) != true {
		t.Fatalf("expected encoder name tie to be broken alphabetically (alpha < beta)")
	}
	if shouldReplaceCodec(b, a) != false {
		t.Fatalf("expected reverse comparison to return false")
	}
}

func TestParseEncoderLineRecognisesVideoAndAudio(t *testing.T) {
	videoLine := "--video-codec=h264 --video-encoder=OMX.qcom.video.encoder.avc (hw)"
	codec, encoder, support, ok := parseEncoderLine(videoLine)
	if !ok {
		t.Fatalf("expected video line to parse")
	}
	if codec != "h264" || encoder != "OMX.qcom.video.encoder.avc" {
		t.Fatalf("unexpected parse: codec=%s encoder=%s", codec, encoder)
	}
	if !support.Hardware {
		t.Fatalf("expected hardware flag for (hw) marker")
	}

	audioLine := "--audio-codec=opus --audio-encoder=c2.android.opus.encoder"
	codec, encoder, support, ok = parseEncoderLine(audioLine)
	if !ok {
		t.Fatalf("expected audio line to parse")
	}
	if codec != "opus" || encoder != "c2.android.opus.encoder" {
		t.Fatalf("unexpected parse: codec=%s encoder=%s", codec, encoder)
	}
	if support.Hardware {
		t.Fatalf("did not expect hardware flag for audio line without (hw)")
	}
}

func TestParseEncoderListSections(t *testing.T) {
	output := `[server] INFO: List of video encoders:
--video-codec=h264 --video-encoder=OMX.alpha (sw)
--video-codec=h264 --video-encoder=OMX.beta (hw)
[server] INFO: List of audio encoders:
--audio-codec=opus --audio-encoder=c2.android.opus.encoder
--audio-codec=opus --audio-encoder=c2.android.opus.encoder
`
	video, audio := ParseEncoderList(output)
	if len(video) != 1 {
		t.Fatalf("expected single best video codec, got %d", len(video))
	}
	if video[0].EncoderName != "OMX.beta" {
		t.Fatalf("expected hardware h264 to win, got %s", video[0].EncoderName)
	}
	if !video[0].Recommended {
		t.Fatalf("expected best video encoder to be marked recommended")
	}
	if len(audio) != 1 {
		t.Fatalf("expected single audio codec, got %d", len(audio))
	}
	if !audio[0].Recommended {
		t.Fatalf("expected best audio encoder to be marked recommended")
	}
}

func TestOptionsToArgsSkipsDefaults(t *testing.T) {
	opts := Options{
		MaxSize:    1024,
		BitRate:    4_000_000,
		VideoCodec: "h264",
		AudioCodec: "opus",
	}
	args := opts.ToArgs()
	if len(args) != 4 {
		t.Fatalf("expected 4 args (--max-size, value, --video-bit-rate, value), got %v", args)
	}
	if args[0] != "--max-size" || args[1] != "1024" {
		t.Fatalf("unexpected first arg pair: %v", args[:2])
	}
	if args[2] != "--video-bit-rate" || args[3] != "4000000" {
		t.Fatalf("unexpected bitrate arg pair: %v", args[2:4])
	}
}

func TestParseEncoderLineExtractsAlias(t *testing.T) {
	line := "--video-codec=h264 --video-encoder=OMX.google.h264.encoder        (sw) (alias for c2.android.avc.encoder)"
	_, _, support, ok := parseEncoderLine(line)
	if !ok {
		t.Fatalf("expected line to parse")
	}
	if support.AliasOf != "c2.android.avc.encoder" {
		t.Fatalf("expected aliasOf to be c2.android.avc.encoder, got %q", support.AliasOf)
	}
}

func TestParseEncoderLineNoAliasForCanonical(t *testing.T) {
	line := "--video-codec=h264 --video-encoder=c2.qti.avc.encoder             (hw) [vendor]"
	_, _, support, ok := parseEncoderLine(line)
	if !ok {
		t.Fatalf("expected line to parse")
	}
	if support.AliasOf != "" {
		t.Fatalf("expected empty aliasOf for canonical encoder, got %q", support.AliasOf)
	}
}

func TestCodecScoreDemotesAliasBelowCanonical(t *testing.T) {
	alias := CodecSupport{Hardware: true, Vendor: true, AliasOf: "c2.qti.avc.encoder"}
	canonical := CodecSupport{Hardware: true, Vendor: true}
	if codecScore(alias) >= codecScore(canonical) {
		t.Fatalf("expected alias score %d to be lower than canonical score %d", codecScore(alias), codecScore(canonical))
	}
}

func TestParseEncoderListPrefersCanonicalOverOMXAlias(t *testing.T) {
	output := `[server] INFO: List of video encoders:
--video-codec=h264 --video-encoder=c2.qti.avc.encoder             (hw) [vendor]
--video-codec=h264 --video-encoder=OMX.qcom.video.encoder.avc     (hw) [vendor] (alias for c2.qti.avc.encoder)
--video-codec=h264 --video-encoder=c2.android.avc.encoder         (sw)
`
	video, _ := ParseEncoderList(output)
	if len(video) != 1 {
		t.Fatalf("expected single h264 entry after dedup, got %d", len(video))
	}
	if video[0].EncoderName != "c2.qti.avc.encoder" {
		t.Fatalf("expected canonical C2 to win, got %s", video[0].EncoderName)
	}
	if !video[0].Recommended {
		t.Fatalf("expected canonical C2 to be marked recommended")
	}
}
