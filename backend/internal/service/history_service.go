package service

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

type HistoryService struct {
	db *gorm.DB
}

func NewHistoryService(db *gorm.DB) *HistoryService {
	return &HistoryService{db: db}
}

func (s *HistoryService) CreateHistory(entry model.History, files []model.HistoryFile) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&entry).Error; err != nil {
			return err
		}
		if len(files) == 0 {
			return nil
		}
		for index := range files {
			files[index].HistoryID = entry.ID
		}
		return tx.Create(&files).Error
	})
}

func (s *HistoryService) ListHistories(page, pageSize int, action string) (dto.HistoryListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}

	var histories []model.History
	query := s.db.Model(&model.History{})
	if action != "" {
		query = query.Where("action = ?", action)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return dto.HistoryListResponse{}, err
	}

	if err := query.Order("timestamp desc").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&histories).Error; err != nil {
		return dto.HistoryListResponse{}, err
	}

	summaries := make([]dto.HistorySummary, 0, len(histories))
	for _, history := range histories {
		summaries = append(summaries, dto.HistorySummary{
			ID:        history.ID,
			Timestamp: history.Timestamp,
			Action:    history.Action,
			FileCount: history.FileCount,
			Status:    history.Status,
		})
	}

	return dto.HistoryListResponse{
		Items:    summaries,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *HistoryService) GetHistory(id string) (dto.HistoryDetailResponse, error) {
	var history model.History
	if err := s.db.Preload("Files").First(&history, "id = ?", id).Error; err != nil {
		return dto.HistoryDetailResponse{}, err
	}

	files := make([]dto.HistoryFileDTO, 0, len(history.Files))
	for _, file := range history.Files {
		files = append(files, dto.HistoryFileDTO{
			ID:           file.ID,
			OriginalPath: file.OriginalPath,
			OriginalName: file.OriginalName,
			NewPath:      file.NewPath,
			NewName:      file.NewName,
			Status:       file.Status,
		})
	}

	return dto.HistoryDetailResponse{
		ID:            history.ID,
		Timestamp:     history.Timestamp,
		Action:        history.Action,
		FileCount:     history.FileCount,
		PresetID:      history.PresetID,
		TargetRootID:  history.TargetRootID,
		TargetPath:    history.TargetPath,
		Status:        history.Status,
		CanUndo:       history.CanUndo,
		UndoExpiresAt: history.UndoExpiresAt,
		Files:         files,
	}, nil
}

func (s *HistoryService) UndoHistory(id string) error {
	var history model.History
	if err := s.db.Preload("Files").First(&history, "id = ?", id).Error; err != nil {
		return err
	}

	if !history.CanUndo {
		return errors.New("history cannot be undone")
	}
	if !history.UndoExpiresAt.IsZero() && time.Now().After(history.UndoExpiresAt) {
		return errors.New("undo expired")
	}

	var undoErrors []error
	for _, file := range history.Files {
		if file.Status != "success" {
			continue
		}
		operation := file.Operation
		if operation == "" {
			operation = history.Action
		}

		switch operation {
		case "copy":
			if err := os.Remove(file.NewPath); err != nil && !errors.Is(err, os.ErrNotExist) {
				undoErrors = append(undoErrors, err)
			}
			continue
		case "move":
		default:
			operation = "move"
		}

		if err := os.MkdirAll(filepath.Dir(file.OriginalPath), 0o755); err != nil {
			undoErrors = append(undoErrors, err)
			continue
		}
		if err := os.Rename(file.NewPath, file.OriginalPath); err != nil {
			undoErrors = append(undoErrors, err)
		}
	}

	status := "undone"
	if len(undoErrors) > 0 {
		status = "undo_failed"
	}

	return s.db.Model(&model.History{}).Where("id = ?", history.ID).Updates(map[string]any{
		"status":   status,
		"can_undo": false,
	}).Error
}

func (s *HistoryService) DeleteBefore(cutoff time.Time) (int64, error) {
	var histories []model.History
	if err := s.db.Where("timestamp < ?", cutoff).Find(&histories).Error; err != nil {
		return 0, err
	}
	if len(histories) == 0 {
		return 0, nil
	}

	ids := make([]string, 0, len(histories))
	for _, history := range histories {
		ids = append(ids, history.ID)
	}

	return int64(len(ids)), s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("history_id IN ?", ids).Delete(&model.HistoryFile{}).Error; err != nil {
			return fmt.Errorf("delete history files: %w", err)
		}
		if err := tx.Where("id IN ?", ids).Delete(&model.History{}).Error; err != nil {
			return fmt.Errorf("delete histories: %w", err)
		}
		return nil
	})
}
