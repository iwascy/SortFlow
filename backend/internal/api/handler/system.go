package handler

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/api/response"
	"sortflow/internal/config"
	"sortflow/internal/dto"
	"sortflow/internal/model"
	"sortflow/internal/pkg/security"
	"sortflow/internal/service"
)

type SystemHandler struct {
	db      *gorm.DB
	cfg     *config.Config
	service *service.ConfigService
}

func NewSystemHandler(db *gorm.DB, cfg *config.Config) *SystemHandler {
	return &SystemHandler{
		db:      db,
		cfg:     cfg,
		service: service.NewConfigService(db),
	}
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

func (h *SystemHandler) AddWatcher(c *gin.Context) {
	var request dto.WatcherRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	if !security.ValidatePath(request.Path, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	info, err := os.Stat(request.Path)
	if err != nil || !info.IsDir() {
		response.AbortWithError(c, response.BadRequest(errors.New("path must be an existing directory")))
		return
	}

	if err := h.service.AddWatcher(request.Path); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.Status(http.StatusCreated)
}

func (h *SystemHandler) RemoveWatcher(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		response.AbortWithError(c, response.BadRequest(errors.New("path is required")))
		return
	}
	if err := h.service.RemoveWatcher(path); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *SystemHandler) CreatePreset(c *gin.Context) {
	var request dto.PresetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	preset, err := h.service.CreatePreset(request)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusCreated, preset)
}

func (h *SystemHandler) UpdatePreset(c *gin.Context) {
	var request dto.PresetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	preset, err := h.service.UpdatePreset(c.Param("id"), request)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, preset)
}

func (h *SystemHandler) DeletePreset(c *gin.Context) {
	if err := h.service.DeletePreset(c.Param("id")); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *SystemHandler) ReorderPresets(c *gin.Context) {
	var request dto.PresetReorderRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	if err := h.service.ReorderPresets(request.IDs); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *SystemHandler) CreateTarget(c *gin.Context) {
	var request dto.TargetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	if !security.ValidatePath(request.Path, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	target, err := h.service.CreateTarget(request)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusCreated, target)
}

func (h *SystemHandler) UpdateTarget(c *gin.Context) {
	var request dto.TargetRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	if !security.ValidatePath(request.Path, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	target, err := h.service.UpdateTarget(c.Param("id"), request)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, target)
}

func (h *SystemHandler) DeleteTarget(c *gin.Context) {
	if err := h.service.DeleteTarget(c.Param("id")); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}
	c.Status(http.StatusNoContent)
}
