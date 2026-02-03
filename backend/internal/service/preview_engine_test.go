package service

import (
	"os"
	"path/filepath"
	"testing"

	"sortflow/internal/dto"
)

func TestGeneratePreviewBatchConflict(t *testing.T) {
	engine := NewPreviewEngine()
	targetDir := t.TempDir()

	files := []dto.FileInfo{
		{ID: "1", Name: "photo.jpg"},
		{ID: "2", Name: "photo.jpg"},
	}

	results := engine.GeneratePreview(files, dto.RenameRules{}, targetDir)
	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}

	if results[0].NewName == results[1].NewName {
		t.Fatalf("expected unique names for batch conflict")
	}
}

func TestGeneratePreviewDiskConflict(t *testing.T) {
	engine := NewPreviewEngine()
	targetDir := t.TempDir()

	existing := filepath.Join(targetDir, "image.png")
	if err := os.WriteFile(existing, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create file: %v", err)
	}

	files := []dto.FileInfo{
		{ID: "1", Name: "image.png"},
	}

	results := engine.GeneratePreview(files, dto.RenameRules{}, targetDir)
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	if results[0].Status != "auto_renamed" {
		t.Fatalf("expected status auto_renamed, got %s", results[0].Status)
	}
	if results[0].StatusReason != "disk_conflict" {
		t.Fatalf("expected reason disk_conflict, got %s", results[0].StatusReason)
	}
	if results[0].NewName == "image.png" {
		t.Fatalf("expected auto-renamed filename")
	}
}
