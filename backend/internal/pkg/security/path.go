package security

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

func ValidatePath(path string, allowedRoots []string) bool {
	resolvedPath, err := resolvePath(path)
	if err != nil {
		return false
	}
	cleanPath := filepath.Clean(resolvedPath)
	for _, root := range allowedRoots {
		rootResolved, err := resolvePath(root)
		if err != nil {
			continue
		}
		cleanRoot := filepath.Clean(rootResolved)
		if cleanPath == cleanRoot {
			return true
		}
		if strings.HasPrefix(cleanPath, cleanRoot+string(os.PathSeparator)) {
			return true
		}
	}
	return false
}

func resolvePath(path string) (string, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	resolved, err := filepath.EvalSymlinks(absPath)
	if err == nil {
		return resolved, nil
	}
	if !errors.Is(err, os.ErrNotExist) {
		return "", err
	}
	parent := filepath.Dir(absPath)
	parentResolved, parentErr := filepath.EvalSymlinks(parent)
	if parentErr != nil {
		return "", parentErr
	}
	return filepath.Join(parentResolved, filepath.Base(absPath)), nil
}
