package service

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

type ExecutionEngine struct {
	db *gorm.DB
}

func NewExecutionEngine(db *gorm.DB) *ExecutionEngine {
	return &ExecutionEngine{db: db}
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

func (e *ExecutionEngine) Execute(taskID string, actions []dto.OrganizeAction) {
	go func() {
		total := len(actions)
		for index, action := range actions {
			if err := e.processFile(action); err != nil {
				e.appendLog(taskID, fmt.Sprintf("%s: %v", action.SourcePath, err))
			}
			progress := float64(index+1) / float64(total)
			e.updateProgress(taskID, progress)
		}
		e.completeTask(taskID)
	}()
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

func (e *ExecutionEngine) completeTask(taskID string) {
	e.db.Model(&model.Task{}).Where("id = ?", taskID).Updates(map[string]any{
		"status":   "completed",
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
