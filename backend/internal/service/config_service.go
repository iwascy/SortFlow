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

func (s *ConfigService) GetSystemConfig() (dto.SystemConfigResponse, error) {
	var watchers []model.SourceWatcher
	var targets []model.TargetRoot
	var presets []model.Preset
	var keywords []model.Keyword

	if err := s.db.Order("path asc").Find(&watchers).Error; err != nil {
		return dto.SystemConfigResponse{}, err
	}
	if err := s.db.Order("name asc").Find(&targets).Error; err != nil {
		return dto.SystemConfigResponse{}, err
	}
	if err := s.db.Order("`order` asc, name asc").Find(&presets).Error; err != nil {
		return dto.SystemConfigResponse{}, err
	}
	if err := s.db.Order("`order` asc, name asc").Find(&keywords).Error; err != nil {
		return dto.SystemConfigResponse{}, err
	}

	config := dto.SystemConfigResponse{
		Watchers: make([]string, 0, len(watchers)),
		Targets:  make([]dto.TargetDTO, 0, len(targets)),
		Presets:  make([]dto.PresetDTO, 0, len(presets)),
		Keywords: make([]dto.KeywordDTO, 0, len(keywords)),
	}

	for _, watcher := range watchers {
		config.Watchers = append(config.Watchers, watcher.Path)
	}

	for _, target := range targets {
		config.Targets = append(config.Targets, dto.TargetDTO{
			ID:   target.ID,
			Name: target.Name,
			Path: target.Path,
			Icon: target.Icon,
		})
	}

	for _, preset := range presets {
		config.Presets = append(config.Presets, dto.PresetDTO{
			ID:            preset.ID,
			Name:          preset.Name,
			Icon:          preset.Icon,
			Color:         preset.Color,
			TargetSubPath: preset.TargetSubPath,
			DefaultPrefix: preset.DefaultPrefix,
			Order:         preset.Order,
		})
	}

	for _, keyword := range keywords {
		config.Keywords = append(config.Keywords, dto.KeywordDTO{
			ID:    keyword.ID,
			Name:  keyword.Name,
			Order: keyword.Order,
		})
	}

	return config, nil
}

func (s *ConfigService) ImportSystemConfig(config dto.SystemConfigResponse) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		writeAll := tx.Session(&gorm.Session{AllowGlobalUpdate: true})

		if err := writeAll.Delete(&model.SourceWatcher{}).Error; err != nil {
			return err
		}
		if err := writeAll.Delete(&model.TargetRoot{}).Error; err != nil {
			return err
		}
		if err := writeAll.Delete(&model.Preset{}).Error; err != nil {
			return err
		}
		if err := writeAll.Delete(&model.Keyword{}).Error; err != nil {
			return err
		}

		if len(config.Watchers) > 0 {
			watchers := make([]model.SourceWatcher, 0, len(config.Watchers))
			for _, path := range config.Watchers {
				watchers = append(watchers, model.SourceWatcher{Path: path})
			}
			if err := tx.Create(&watchers).Error; err != nil {
				return err
			}
		}

		if len(config.Targets) > 0 {
			targets := make([]model.TargetRoot, 0, len(config.Targets))
			for _, target := range config.Targets {
				id := target.ID
				if id == "" {
					id = uuid.NewString()
				}
				targets = append(targets, model.TargetRoot{
					ID:   id,
					Name: target.Name,
					Path: target.Path,
					Icon: target.Icon,
				})
			}
			if err := tx.Create(&targets).Error; err != nil {
				return err
			}
		}

		if len(config.Presets) > 0 {
			presets := make([]model.Preset, 0, len(config.Presets))
			for _, preset := range config.Presets {
				id := preset.ID
				if id == "" {
					id = uuid.NewString()
				}
				presets = append(presets, model.Preset{
					ID:            id,
					Name:          preset.Name,
					Icon:          preset.Icon,
					Color:         preset.Color,
					TargetSubPath: preset.TargetSubPath,
					DefaultPrefix: preset.DefaultPrefix,
					Order:         preset.Order,
				})
			}
			if err := tx.Create(&presets).Error; err != nil {
				return err
			}
		}

		if len(config.Keywords) > 0 {
			keywords := make([]model.Keyword, 0, len(config.Keywords))
			for _, keyword := range config.Keywords {
				id := keyword.ID
				if id == "" {
					id = uuid.NewString()
				}
				keywords = append(keywords, model.Keyword{
					ID:    id,
					Name:  keyword.Name,
					Order: keyword.Order,
				})
			}
			if err := tx.Create(&keywords).Error; err != nil {
				return err
			}
		}

		return nil
	})
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
