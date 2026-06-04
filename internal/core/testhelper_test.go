package core

import "os"

func writeFileForTest(path string) error {
	return os.WriteFile(path, []byte("test data"), 0o644)
}
