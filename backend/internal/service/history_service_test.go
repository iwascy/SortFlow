package service

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"

	"sortflow/internal/model"
)

func TestHistoryServiceCreateGetAndList(t *testing.T) {
	db := newTestDB(t)
	service := NewHistoryService(db)

	entry := model.History{
		ID:            uuid.NewString(),
		Action:        "move",
		FileCount:     1,
		PresetID:      "preset-1",
		TargetRootID:  "root-1",
		TargetPath:    "/tmp/target",
		Status:        "completed",
		CanUndo:       true,
		UndoExpiresAt: time.Now().Add(24 * time.Hour),
	}
	files := []model.HistoryFile{
		{
			OriginalPath: "/tmp/source.txt",
			OriginalName: "source.txt",
			NewPath:      "/tmp/target/source.txt",
			NewName:      "source.txt",
			Status:       "success",
		},
	}

	if err := service.CreateHistory(entry, files); err != nil {
		t.Fatalf("failed to create history: %v", err)
	}

	history, err := service.GetHistory(entry.ID)
	if err != nil {
		t.Fatalf("failed to get history: %v", err)
	}
	if history.ID != entry.ID {
		t.Fatalf("expected history ID %s, got %s", entry.ID, history.ID)
	}
	if len(history.Files) != 1 {
		t.Fatalf("expected 1 history file, got %d", len(history.Files))
	}

	response, err := service.ListHistories(1, 10, "move")
	if err != nil {
		t.Fatalf("failed to list histories: %v", err)
	}
	if response.Total != 1 {
		t.Fatalf("expected total 1, got %d", response.Total)
	}
	if len(response.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(response.Items))
	}
}

func TestHistoryServiceUndoHistory(t *testing.T) {
	db := newTestDB(t)
	service := NewHistoryService(db)

	tempDir := t.TempDir()
	originalPath := filepath.Join(tempDir, "original.txt")
	newPath := filepath.Join(tempDir, "renamed", "original.txt")
	if err := os.MkdirAll(filepath.Dir(newPath), 0o755); err != nil {
		t.Fatalf("failed to create target dir: %v", err)
	}
	if err := os.WriteFile(newPath, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create target file: %v", err)
	}

	entry := model.History{
		ID:            uuid.NewString(),
		Action:        "move",
		FileCount:     1,
		PresetID:      "preset-1",
		TargetRootID:  "root-1",
		TargetPath:    filepath.Dir(newPath),
		Status:        "completed",
		CanUndo:       true,
		UndoExpiresAt: time.Now().Add(24 * time.Hour),
	}
	files := []model.HistoryFile{
		{
			OriginalPath: originalPath,
			OriginalName: "original.txt",
			NewPath:      newPath,
			NewName:      "original.txt",
			Status:       "success",
		},
	}

	if err := service.CreateHistory(entry, files); err != nil {
		t.Fatalf("failed to create history: %v", err)
	}

	if err := service.UndoHistory(entry.ID); err != nil {
		t.Fatalf("failed to undo history: %v", err)
	}

	if _, err := os.Stat(originalPath); err != nil {
		t.Fatalf("expected original file restored: %v", err)
	}

	var updated model.History
	if err := db.First(&updated, "id = ?", entry.ID).Error; err != nil {
		t.Fatalf("failed to load updated history: %v", err)
	}
	if updated.Status != "undone" {
		t.Fatalf("expected status undone, got %s", updated.Status)
	}
	if updated.CanUndo {
		t.Fatalf("expected can_undo to be false")
	}
}

func TestHistoryServiceDeleteBefore(t *testing.T) {
	db := newTestDB(t)
	service := NewHistoryService(db)

	oldEntry := model.History{
		ID:            uuid.NewString(),
		Action:        "move",
		FileCount:     0,
		PresetID:      "preset-1",
		TargetRootID:  "root-1",
		TargetPath:    "/tmp/target",
		Status:        "completed",
		CanUndo:       false,
		UndoExpiresAt: time.Now().Add(24 * time.Hour),
	}
	if err := service.CreateHistory(oldEntry, nil); err != nil {
		t.Fatalf("failed to create history: %v", err)
	}

	if err := db.Model(&model.History{}).Where("id = ?", oldEntry.ID).
		Update("timestamp", time.Now().Add(-2*time.Hour)).Error; err != nil {
		t.Fatalf("failed to update timestamp: %v", err)
	}

	newEntry := model.History{
		ID:            uuid.NewString(),
		Action:        "copy",
		FileCount:     0,
		PresetID:      "preset-2",
		TargetRootID:  "root-2",
		TargetPath:    "/tmp/target",
		Status:        "completed",
		CanUndo:       false,
		UndoExpiresAt: time.Now().Add(24 * time.Hour),
	}
	if err := service.CreateHistory(newEntry, nil); err != nil {
		t.Fatalf("failed to create history: %v", err)
	}

	deleted, err := service.DeleteBefore(time.Now().Add(-time.Hour))
	if err != nil {
		t.Fatalf("failed to delete histories: %v", err)
	}
	if deleted != 1 {
		t.Fatalf("expected 1 deleted history, got %d", deleted)
	}

	var remaining int64
	if err := db.Model(&model.History{}).Count(&remaining).Error; err != nil {
		t.Fatalf("failed to count histories: %v", err)
	}
	if remaining != 1 {
		t.Fatalf("expected 1 remaining history, got %d", remaining)
	}
}

func TestHistoryServiceUndoHistoryCopy(t *testing.T) {
	db := newTestDB(t)
	service := NewHistoryService(db)

	tempDir := t.TempDir()
	originalPath := filepath.Join(tempDir, "original.txt")
	if err := os.WriteFile(originalPath, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create original file: %v", err)
	}
	newPath := filepath.Join(tempDir, "copy", "original.txt")
	if err := os.MkdirAll(filepath.Dir(newPath), 0o755); err != nil {
		t.Fatalf("failed to create copy dir: %v", err)
	}
	if err := os.WriteFile(newPath, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create copied file: %v", err)
	}

	entry := model.History{
		ID:            uuid.NewString(),
		Action:        "copy",
		FileCount:     1,
		PresetID:      "preset-1",
		TargetRootID:  "root-1",
		TargetPath:    filepath.Dir(newPath),
		Status:        "completed",
		CanUndo:       true,
		UndoExpiresAt: time.Now().Add(24 * time.Hour),
	}
	files := []model.HistoryFile{
		{
			Operation:    "copy",
			OriginalPath: originalPath,
			OriginalName: "original.txt",
			NewPath:      newPath,
			NewName:      "original.txt",
			Status:       "success",
		},
	}

	if err := service.CreateHistory(entry, files); err != nil {
		t.Fatalf("failed to create history: %v", err)
	}

	if err := service.UndoHistory(entry.ID); err != nil {
		t.Fatalf("failed to undo history: %v", err)
	}

	if _, err := os.Stat(originalPath); err != nil {
		t.Fatalf("expected original file to remain: %v", err)
	}
	if _, err := os.Stat(newPath); !os.IsNotExist(err) {
		t.Fatalf("expected copied file removed, got: %v", err)
	}

	var updated model.History
	if err := db.First(&updated, "id = ?", entry.ID).Error; err != nil {
		t.Fatalf("failed to load updated history: %v", err)
	}
	if updated.Status != "undone" {
		t.Fatalf("expected status undone, got %s", updated.Status)
	}
	if updated.CanUndo {
		t.Fatalf("expected can_undo to be false")
	}
}
