package handler

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/api/response"
	"sortflow/internal/config"
	"sortflow/internal/dto"
	"sortflow/internal/model"
	"sortflow/internal/pkg/security"
	"sortflow/internal/pkg/thumbnail"
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
	var keywords []model.Keyword

	h.db.Find(&watchers)
	h.db.Find(&targets)
	h.db.Find(&presets)
	h.db.Find(&keywords)

	response := dto.SystemConfigResponse{
		Watchers: make([]string, 0, len(watchers)),
		Targets:  make([]dto.TargetDTO, 0, len(targets)),
		Presets:  make([]dto.PresetDTO, 0, len(presets)),
		Keywords: make([]dto.KeywordDTO, 0, len(keywords)),
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

	for _, keyword := range keywords {
		response.Keywords = append(response.Keywords, dto.KeywordDTO{
			ID:    keyword.ID,
			Name:  keyword.Name,
			Order: keyword.Order,
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

func (h *SystemHandler) CreateKeyword(c *gin.Context) {
	var request dto.KeywordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	keyword, err := h.service.CreateKeyword(request)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusCreated, keyword)
}

func (h *SystemHandler) UpdateKeyword(c *gin.Context) {
	var request dto.KeywordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	keyword, err := h.service.UpdateKeyword(c.Param("id"), request)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, keyword)
}

func (h *SystemHandler) DeleteKeyword(c *gin.Context) {
	if err := h.service.DeleteKeyword(c.Param("id")); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *SystemHandler) GenerateVideoCovers(c *gin.Context) {
	type generateVideoCoversResponse struct {
		Total     int `json:"total"`
		Generated int `json:"generated"`
		Failed    int `json:"failed"`
	}

	var watchers []model.SourceWatcher
	h.db.Find(&watchers)

	total := 0
	generated := 0
	failed := 0

	for _, watcher := range watchers {
		_ = filepath.WalkDir(watcher.Path, func(current string, d os.DirEntry, walkErr error) error {
			if walkErr != nil {
				failed++
				return nil
			}
			if d.IsDir() || !thumbnail.IsVideoFile(current) {
				return nil
			}

			total++
			if _, err := thumbnail.GenerateThumbnail(current, h.cfg.ThumbnailSize); err != nil {
				failed++
				return nil
			}
			generated++
			return nil
		})
	}

	c.JSON(http.StatusOK, generateVideoCoversResponse{
		Total:     total,
		Generated: generated,
		Failed:    failed,
	})
}
