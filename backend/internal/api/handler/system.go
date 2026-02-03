package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

type SystemHandler struct {
	db *gorm.DB
}

func NewSystemHandler(db *gorm.DB) *SystemHandler {
	return &SystemHandler{db: db}
}

func (h *SystemHandler) GetConfig(c *gin.Context) {
	var watchers []model.SourceWatcher
	var targets []model.TargetRoot
	var presets []model.Preset

	h.db.Find(&watchers)
	h.db.Find(&targets)
	h.db.Find(&presets)

	response := dto.SystemConfigResponse{
		Watchers: make([]string, 0, len(watchers)),
		Targets:  make([]dto.TargetDTO, 0, len(targets)),
		Presets:  make([]dto.PresetDTO, 0, len(presets)),
	}

	for _, watcher := range watchers {
		response.Watchers = append(response.Watchers, watcher.Path)
	}

	for _, target := range targets {
		response.Targets = append(response.Targets, dto.TargetDTO{
			ID:   target.ID,
			Name: target.Name,
			Path: target.Path,
			Icon: target.Icon,
		})
	}

	for _, preset := range presets {
		response.Presets = append(response.Presets, dto.PresetDTO{
			ID:            preset.ID,
			Name:          preset.Name,
			Icon:          preset.Icon,
			Color:         preset.Color,
			TargetSubPath: preset.TargetSubPath,
			DefaultPrefix: preset.DefaultPrefix,
			Order:         preset.Order,
		})
	}

	c.JSON(http.StatusOK, response)
}
