package security

import (
	"path/filepath"
	"strings"
)

func ValidatePath(path string, allowedRoots []string) bool {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return false
	}
	cleanPath := filepath.Clean(absPath)
	for _, root := range allowedRoots {
		rootAbs, err := filepath.Abs(root)
		if err != nil {
			continue
		}
		cleanRoot := filepath.Clean(rootAbs)
		if strings.HasPrefix(cleanPath, cleanRoot) {
			return true
		}
	}
	return false
}
