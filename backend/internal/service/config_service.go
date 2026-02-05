package service

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

type ConfigService struct {
	db *gorm.DB
}

func NewConfigService(db *gorm.DB) *ConfigService {
	return &ConfigService{db: db}
}

func (s *ConfigService) AddWatcher(path string) error {
	watcher := model.SourceWatcher{Path: path}
	return s.db.Create(&watcher).Error
}

func (s *ConfigService) RemoveWatcher(path string) error {
	return s.db.Where("path = ?", path).Delete(&model.SourceWatcher{}).Error
}

func (s *ConfigService) CreatePreset(request dto.PresetRequest) (*model.Preset, error) {
	preset := &model.Preset{
		ID:            uuid.NewString(),
		Name:          request.Name,
		Icon:          request.Icon,
		Color:         request.Color,
		TargetSubPath: request.TargetSubPath,
		DefaultPrefix: request.DefaultPrefix,
		Order:         request.Order,
	}
	if err := s.db.Create(preset).Error; err != nil {
		return nil, err
	}
	return preset, nil
}

func (s *ConfigService) UpdatePreset(id string, request dto.PresetRequest) (*model.Preset, error) {
	var preset model.Preset
	if err := s.db.First(&preset, "id = ?", id).Error; err != nil {
		return nil, err
	}
	preset.Name = request.Name
	preset.Icon = request.Icon
	preset.Color = request.Color
	preset.TargetSubPath = request.TargetSubPath
	preset.DefaultPrefix = request.DefaultPrefix
	preset.Order = request.Order

	if err := s.db.Save(&preset).Error; err != nil {
		return nil, err
	}
	return &preset, nil
}

func (s *ConfigService) DeletePreset(id string) error {
	return s.db.Delete(&model.Preset{}, "id = ?", id).Error
}

func (s *ConfigService) ReorderPresets(ids []string) error {
	if len(ids) == 0 {
		return errors.New("preset ids required")
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		for index, id := range ids {
			if err := tx.Model(&model.Preset{}).Where("id = ?", id).Update("order", index).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *ConfigService) CreateTarget(request dto.TargetRequest) (*model.TargetRoot, error) {
	target := &model.TargetRoot{
		ID:   uuid.NewString(),
		Name: request.Name,
		Path: request.Path,
		Icon: request.Icon,
	}
	if err := s.db.Create(target).Error; err != nil {
		return nil, err
	}
	return target, nil
}

func (s *ConfigService) UpdateTarget(id string, request dto.TargetRequest) (*model.TargetRoot, error) {
	var target model.TargetRoot
	if err := s.db.First(&target, "id = ?", id).Error; err != nil {
		return nil, err
	}
	target.Name = request.Name
	target.Path = request.Path
	target.Icon = request.Icon

	if err := s.db.Save(&target).Error; err != nil {
		return nil, err
	}
	return &target, nil
}

func (s *ConfigService) DeleteTarget(id string) error {
	return s.db.Delete(&model.TargetRoot{}, "id = ?", id).Error
}

func (s *ConfigService) CreateKeyword(request dto.KeywordRequest) (*model.Keyword, error) {
	keyword := &model.Keyword{
		ID:    uuid.NewString(),
		Name:  request.Name,
		Order: request.Order,
	}
	if err := s.db.Create(keyword).Error; err != nil {
		return nil, err
	}
	return keyword, nil
}

func (s *ConfigService) UpdateKeyword(id string, request dto.KeywordRequest) (*model.Keyword, error) {
	var keyword model.Keyword
	if err := s.db.First(&keyword, "id = ?", id).Error; err != nil {
		return nil, err
	}
	keyword.Name = request.Name
	keyword.Order = request.Order

	if err := s.db.Save(&keyword).Error; err != nil {
		return nil, err
	}
	return &keyword, nil
}

func (s *ConfigService) DeleteKeyword(id string) error {
	return s.db.Delete(&model.Keyword{}, "id = ?", id).Error
}
