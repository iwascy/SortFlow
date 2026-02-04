package service

import (
	"context"
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
	"sortflow/internal/pkg/security"
)

type ExecutionEngine struct {
	db           *gorm.DB
	history      *HistoryService
	allowedRoots []string
	cancelMu     sync.Mutex
	cancels      map[string]context.CancelFunc
}

func NewExecutionEngine(db *gorm.DB, allowedRoots []string) *ExecutionEngine {
	return &ExecutionEngine{
		db:           db,
		history:      NewHistoryService(db),
		allowedRoots: allowedRoots,
		cancels:      make(map[string]context.CancelFunc),
	}
}

var (
	ErrTaskNotFound   = errors.New("task not found")
	ErrTaskNotRunning = errors.New("task not running")
)

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

func (e *ExecutionEngine) CancelTask(taskID string) error {
	if e.db == nil {
		return errors.New("database is required")
	}

	var task model.Task
	if err := e.db.First(&task, "id = ?", taskID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTaskNotFound
		}
		return err
	}
	if task.Status != "running" {
		return ErrTaskNotRunning
	}

	e.cancelMu.Lock()
	cancel, ok := e.cancels[taskID]
	e.cancelMu.Unlock()
	if !ok {
		return ErrTaskNotRunning
	}
	cancel()
	return nil
}

func (e *ExecutionEngine) Execute(taskID string, request dto.ExecuteRequest) error {
	if e.db == nil {
		return errors.New("database is required")
	}
	if !security.ValidatePath(request.TargetPath, e.allowedRoots) {
		return errors.New("path not allowed")
	}
	for _, action := range request.Actions {
		if !security.ValidatePath(action.SourcePath, e.allowedRoots) || !security.ValidatePath(action.TargetPath, e.allowedRoots) {
			return errors.New("path not allowed")
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	e.storeCancel(taskID, cancel)

	go func() {
		defer e.removeCancel(taskID)

		actions := request.Actions
		total := len(actions)
		if total == 0 {
			e.finalizeTask(taskID, "completed", 1)
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
				for {
					select {
					case <-ctx.Done():
						return
					case action, ok := <-actionChan:
						if !ok {
							return
						}
						err := e.processFile(action)
						resultChan <- actionResult{action: action, err: err}
					}
				}
			}()
		}

		go func() {
			for _, action := range actions {
				select {
				case <-ctx.Done():
					close(actionChan)
					wg.Wait()
					close(resultChan)
					return
				case actionChan <- action:
				}
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
		if ctx.Err() != nil {
			status = "cancelled"
		} else if hasError {
			status = "failed"
		}

		fileCount := len(historyFiles)
		canUndo := fileCount > 0
		undoExpiresAt := time.Time{}
		if canUndo {
			undoExpiresAt = time.Now().Add(7 * 24 * time.Hour)
		}

		historyEntry := model.History{
			ID:            uuid.NewString(),
			Action:        request.Action,
			FileCount:     fileCount,
			PresetID:      request.PresetID,
			TargetRootID:  request.TargetRootID,
			TargetPath:    request.TargetPath,
			Status:        status,
			CanUndo:       canUndo,
			UndoExpiresAt: undoExpiresAt,
		}
		_ = e.history.CreateHistory(historyEntry, historyFiles)

		finalProgress := 1.0
		if status == "cancelled" && total > 0 {
			finalProgress = float64(atomic.LoadInt64(&processed)) / float64(total)
		}
		e.finalizeTask(taskID, status, finalProgress)
	}()
	return nil
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
		Operation:    result.action.Operation,
		OriginalPath: result.action.SourcePath,
		OriginalName: filepath.Base(result.action.SourcePath),
		NewPath:      result.action.TargetPath,
		NewName:      filepath.Base(result.action.TargetPath),
		Status:       status,
	}
}

func (e *ExecutionEngine) processFile(action dto.OrganizeAction) error {
	if !security.ValidatePath(action.SourcePath, e.allowedRoots) || !security.ValidatePath(action.TargetPath, e.allowedRoots) {
		return errors.New("path not allowed")
	}
	switch action.Operation {
	case "move":
		if err := os.MkdirAll(filepath.Dir(action.TargetPath), 0o755); err != nil {
			return err
		}
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

func (e *ExecutionEngine) finalizeTask(taskID, status string, progress float64) {
	e.db.Model(&model.Task{}).Where("id = ?", taskID).Updates(map[string]any{
		"status":   status,
		"progress": progress,
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

func (e *ExecutionEngine) storeCancel(taskID string, cancel context.CancelFunc) {
	e.cancelMu.Lock()
	defer e.cancelMu.Unlock()
	e.cancels[taskID] = cancel
}

func (e *ExecutionEngine) removeCancel(taskID string) {
	e.cancelMu.Lock()
	defer e.cancelMu.Unlock()
	delete(e.cancels, taskID)
}
