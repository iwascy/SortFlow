package security

import (
	"os"
	"path/filepath"
	"testing"
)

func TestValidatePath(t *testing.T) {
	tempDir := t.TempDir()
	allowed := []string{tempDir}

	validPath := filepath.Join(tempDir, "nested", "file.txt")
	if !ValidatePath(validPath, allowed) {
		t.Fatalf("expected path to be valid")
	}

	sibling := filepath.Join(filepath.Dir(tempDir), filepath.Base(tempDir)+"-other")
	if ValidatePath(sibling, allowed) {
		t.Fatalf("expected sibling path to be invalid")
	}

	outsideDir := t.TempDir()
	linkPath := filepath.Join(tempDir, "link")
	if err := os.Symlink(outsideDir, linkPath); err != nil {
		t.Skipf("symlink not supported: %v", err)
	}
	escapedPath := filepath.Join(linkPath, "escaped.txt")
	if ValidatePath(escapedPath, allowed) {
		t.Fatalf("expected symlink escape path to be invalid")
	}
}
