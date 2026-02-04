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
	if path == "" {
		return "", os.ErrInvalid
	}
	if path == "~" || strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err == nil {
			if path == "~" {
				path = home
			} else {
				path = filepath.Join(home, path[2:])
			}
		}
	}
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

	// Walk up to the nearest existing ancestor to resolve symlinks,
	// then rebuild the absolute path from there.
	parent := absPath
	for {
		parent = filepath.Dir(parent)
		if parent == "." || parent == string(os.PathSeparator) {
			break
		}
		parentResolved, parentErr := filepath.EvalSymlinks(parent)
		if parentErr == nil {
			rel, relErr := filepath.Rel(parent, absPath)
			if relErr != nil {
				return absPath, nil
			}
			return filepath.Join(parentResolved, rel), nil
		}
		if !errors.Is(parentErr, os.ErrNotExist) {
			return "", parentErr
		}
	}

	return absPath, nil
}
