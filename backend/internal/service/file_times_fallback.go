//go:build !darwin

package service

import (
	"os"
	"time"
)

func getCreateTime(info os.FileInfo) time.Time {
	return info.ModTime()
}
