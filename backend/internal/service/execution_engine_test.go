package service

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

func TestExecutionEngineProcessFile(t *testing.T) {
	tempDir := t.TempDir()
	engine := NewExecutionEngine(nil, []string{tempDir})

	moveSrc := filepath.Join(tempDir, "move.txt")
	moveDst := filepath.Join(tempDir, "moved", "move.txt")
	if err := os.WriteFile(moveSrc, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create source file: %v", err)
	}

	if err := engine.processFile(dto.OrganizeAction{
		SourcePath: moveSrc,
		TargetPath: moveDst,
		Operation:  "move",
	}); err != nil {
		t.Fatalf("expected move to succeed: %v", err)
	}

	if _, err := os.Stat(moveDst); err != nil {
		t.Fatalf("expected moved file to exist: %v", err)
	}
	if _, err := os.Stat(moveSrc); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected source to be removed, got: %v", err)
	}

	copySrc := filepath.Join(tempDir, "copy.txt")
	copyDst := filepath.Join(tempDir, "copied", "copy.txt")
	if err := os.WriteFile(copySrc, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create copy source file: %v", err)
	}

	if err := engine.processFile(dto.OrganizeAction{
		SourcePath: copySrc,
		TargetPath: copyDst,
		Operation:  "copy",
	}); err != nil {
		t.Fatalf("expected copy to succeed: %v", err)
	}

	if _, err := os.Stat(copySrc); err != nil {
		t.Fatalf("expected copy source to remain: %v", err)
	}
	if _, err := os.Stat(copyDst); err != nil {
		t.Fatalf("expected copied file to exist: %v", err)
	}

	if err := engine.processFile(dto.OrganizeAction{
		SourcePath: copySrc,
		TargetPath: copyDst,
		Operation:  "delete",
	}); err == nil {
		t.Fatalf("expected unsupported operation error")
	}
}

func TestExecutionEngineExecuteUpdatesProgressAndLogs(t *testing.T) {
	db := newTestDB(t)
	tempDir := t.TempDir()
	engine := NewExecutionEngine(db, []string{tempDir})

	task, err := engine.CreateTask()
	if err != nil {
		t.Fatalf("failed to create task: %v", err)
	}

	src := filepath.Join(tempDir, "source.txt")
	if err := os.WriteFile(src, []byte("data"), 0o644); err != nil {
		t.Fatalf("failed to create source file: %v", err)
	}
	moveDst := filepath.Join(tempDir, "dest", "source.txt")

	request := dto.ExecuteRequest{
		Action:       "move",
		PresetID:     "preset-1",
		TargetRootID: "root-1",
		TargetPath:   filepath.Join(tempDir, "dest"),
		Actions: []dto.OrganizeAction{
			{
				SourcePath: src,
				TargetPath: moveDst,
				Operation:  "move",
			},
			{
				SourcePath: filepath.Join(tempDir, "missing.txt"),
				TargetPath: filepath.Join(tempDir, "dest", "missing.txt"),
				Operation:  "copy",
			},
		},
	}

	if err := engine.Execute(task.ID, request); err != nil {
		t.Fatalf("failed to execute task: %v", err)
	}

	updated := waitForTaskCompletion(t, db, task.ID)
	if updated.Status != "failed" {
		t.Fatalf("expected task status failed, got %s", updated.Status)
	}
	if updated.Progress != 1 {
		t.Fatalf("expected progress to be 1, got %f", updated.Progress)
	}
	if !strings.Contains(updated.Logs, "missing.txt") {
		t.Fatalf("expected logs to contain missing file error, got %q", updated.Logs)
	}

	var historyCount int64
	if err := db.Model(&model.History{}).Count(&historyCount).Error; err != nil {
		t.Fatalf("failed to query history: %v", err)
	}
	if historyCount != 1 {
		t.Fatalf("expected 1 history entry, got %d", historyCount)
	}
}

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	if err := db.AutoMigrate(&model.Task{}, &model.History{}, &model.HistoryFile{}); err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}
	return db
}

func waitForTaskCompletion(t *testing.T, db *gorm.DB, taskID string) model.Task {
	t.Helper()

	timeout := time.After(2 * time.Second)
	ticker := time.NewTicker(20 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			t.Fatalf("timed out waiting for task completion")
		case <-ticker.C:
			var task model.Task
			if err := db.First(&task, "id = ?", taskID).Error; err != nil {
				t.Fatalf("failed to load task: %v", err)
			}
			if task.Status == "completed" || task.Status == "failed" {
				return task
			}
		}
	}
}
