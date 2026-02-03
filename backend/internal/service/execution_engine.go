package service

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

type ExecutionEngine struct {
	db      *gorm.DB
	history *HistoryService
}

func NewExecutionEngine(db *gorm.DB) *ExecutionEngine {
	return &ExecutionEngine{
		db:      db,
		history: NewHistoryService(db),
	}
}

func (e *ExecutionEngine) CreateTask() (*model.Task, error) {
	task := &model.Task{
		ID:       uuid.NewString(),
		Status:   "running",
		Progress: 0,
	}
	if err := e.db.Create(task).Error; err != nil {
		return nil, err
	}
	return task, nil
}

func (e *ExecutionEngine) Execute(taskID string, request dto.ExecuteRequest) {
	go func() {
		actions := request.Actions
		total := len(actions)
		if total == 0 {
			e.completeTask(taskID, "completed")
			return
		}

		workerCount := runtime.NumCPU()
		if workerCount > total {
			workerCount = total
		}

		actionChan := make(chan dto.OrganizeAction)
		resultChan := make(chan actionResult, total)
		var processed int64
		var wg sync.WaitGroup

		for i := 0; i < workerCount; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for action := range actionChan {
					err := e.processFile(action)
					resultChan <- actionResult{action: action, err: err}
				}
			}()
		}

		go func() {
			for _, action := range actions {
				actionChan <- action
			}
			close(actionChan)
			wg.Wait()
			close(resultChan)
		}()

		historyFiles := make([]model.HistoryFile, 0, total)
		hasError := false

		for result := range resultChan {
			if result.err != nil {
				hasError = true
				e.appendLog(taskID, fmt.Sprintf("%s: %v", result.action.SourcePath, result.err))
			}
			historyFiles = append(historyFiles, buildHistoryFile(result))

			current := atomic.AddInt64(&processed, 1)
			progress := float64(current) / float64(total)
			e.updateProgress(taskID, progress)
		}

		status := "completed"
		if hasError {
			status = "failed"
		}

		historyEntry := model.History{
			ID:            uuid.NewString(),
			Action:        request.Action,
			FileCount:     total,
			PresetID:      request.PresetID,
			TargetRootID:  request.TargetRootID,
			TargetPath:    request.TargetPath,
			Status:        status,
			CanUndo:       true,
			UndoExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		}
		_ = e.history.CreateHistory(historyEntry, historyFiles)

		e.completeTask(taskID, status)
	}()
}

type actionResult struct {
	action dto.OrganizeAction
	err    error
}

func buildHistoryFile(result actionResult) model.HistoryFile {
	status := "success"
	if result.err != nil {
		status = "failed"
	}
	return model.HistoryFile{
		OriginalPath: result.action.SourcePath,
		OriginalName: filepath.Base(result.action.SourcePath),
		NewPath:      result.action.TargetPath,
		NewName:      filepath.Base(result.action.TargetPath),
		Status:       status,
	}
}

func (e *ExecutionEngine) processFile(action dto.OrganizeAction) error {
	switch action.Operation {
	case "move":
		return os.Rename(action.SourcePath, action.TargetPath)
	case "copy":
		return copyFile(action.SourcePath, action.TargetPath)
	default:
		return errors.New("unsupported operation")
	}
}

func copyFile(src, dst string) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	target, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer target.Close()

	if _, err := io.Copy(target, source); err != nil {
		return err
	}

	return target.Sync()
}

func (e *ExecutionEngine) updateProgress(taskID string, progress float64) {
	e.db.Model(&model.Task{}).Where("id = ?", taskID).Updates(map[string]any{
		"progress": progress,
	})
}

func (e *ExecutionEngine) completeTask(taskID, status string) {
	e.db.Model(&model.Task{}).Where("id = ?", taskID).Updates(map[string]any{
		"status":   status,
		"progress": 1,
	})
}

func (e *ExecutionEngine) appendLog(taskID, message string) {
	var task model.Task
	if err := e.db.First(&task, "id = ?", taskID).Error; err != nil {
		return
	}
	if task.Logs == "" {
		task.Logs = message
	} else {
		task.Logs = task.Logs + "\n" + message
	}
	e.db.Model(&model.Task{}).Where("id = ?", taskID).Update("logs", task.Logs)
}
