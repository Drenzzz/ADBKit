package file

import "os"

type osFileInfo = os.FileInfo

func osStat(path string) (os.FileInfo, error) {
	return os.Stat(path)
}
