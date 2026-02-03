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
	if results[0].NewName != "photo.jpg" {
		t.Fatalf("expected first name photo.jpg, got %s", results[0].NewName)
	}
	if results[1].NewName != "photo_1.jpg" {
		t.Fatalf("expected second name photo_1.jpg, got %s", results[1].NewName)
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

func TestGeneratePreviewNamingRules(t *testing.T) {
	engine := NewPreviewEngine()
	targetDir := t.TempDir()

	files := []dto.FileInfo{
		{ID: "1", Name: "photo.jpg"},
	}

	rules := dto.RenameRules{
		Prefix:      "pre_",
		Suffix:      "_suf",
		UseOriginal: false,
	}

	results := engine.GeneratePreview(files, rules, targetDir)
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].NewName != "pre_photo_suf.jpg" {
		t.Fatalf("expected name pre_photo_suf.jpg, got %s", results[0].NewName)
	}
	if results[0].Status != "ready" {
		t.Fatalf("expected status ready, got %s", results[0].Status)
	}
	if results[0].StatusReason != "" {
		t.Fatalf("expected empty status reason, got %s", results[0].StatusReason)
	}
}

func TestGeneratePreviewUsesOriginalName(t *testing.T) {
	engine := NewPreviewEngine()
	targetDir := t.TempDir()

	files := []dto.FileInfo{
		{ID: "1", Name: "sample.txt"},
	}

	rules := dto.RenameRules{
		Prefix:      "pre_",
		Suffix:      "_suf",
		UseOriginal: true,
	}

	results := engine.GeneratePreview(files, rules, targetDir)
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].NewName != "sample.txt" {
		t.Fatalf("expected original name sample.txt, got %s", results[0].NewName)
	}
	if results[0].Status != "ready" {
		t.Fatalf("expected status ready, got %s", results[0].Status)
	}
	if results[0].StatusReason != "" {
		t.Fatalf("expected empty status reason, got %s", results[0].StatusReason)
	}
}

func TestGeneratePreviewAutoRenameSkipsExistingSuffixes(t *testing.T) {
	engine := NewPreviewEngine()
	targetDir := t.TempDir()

	existing := []string{
		filepath.Join(targetDir, "image.png"),
		filepath.Join(targetDir, "image_1.png"),
	}
	for _, path := range existing {
		if err := os.WriteFile(path, []byte("data"), 0o644); err != nil {
			t.Fatalf("failed to create file: %v", err)
		}
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
	if results[0].NewName != "image_2.png" {
		t.Fatalf("expected name image_2.png, got %s", results[0].NewName)
	}
}
