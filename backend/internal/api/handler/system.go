package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

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
	systemConfig, err := h.service.GetSystemConfig()
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}
	c.JSON(http.StatusOK, normalizeSystemConfig(systemConfig))
}

func (h *SystemHandler) ExportConfig(c *gin.Context) {
	systemConfig, err := h.service.GetSystemConfig()
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	exportedAt := time.Now().UTC()
	filename := fmt.Sprintf("sortflow-config-%s.json", exportedAt.Format("20060102-150405"))
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.JSON(http.StatusOK, dto.SystemConfigExportResponse{
		Version:    dto.ConfigExportVersion,
		ExportedAt: exportedAt.Format(time.RFC3339),
		Config:     normalizeSystemConfig(systemConfig),
	})
}

func (h *SystemHandler) ImportConfig(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		response.AbortWithError(c, response.BadRequest(errors.New("failed to read request body")))
		return
	}
	if len(payload) == 0 {
		response.AbortWithError(c, response.BadRequest(errors.New("request body is required")))
		return
	}

	request, err := parseImportPayload(payload)
	if err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	request.Config = sanitizeSystemConfig(request.Config)
	request.Config = normalizeSystemConfig(request.Config)
	if apiErr := h.validateImportConfig(request.Config); apiErr != nil {
		response.AbortWithError(c, apiErr)
		return
	}

	if err := h.service.ImportSystemConfig(request.Config); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.Status(http.StatusNoContent)
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

func parseImportPayload(payload []byte) (dto.SystemConfigImportRequest, error) {
	type importEnvelope struct {
		Version int                       `json:"version"`
		Config  *dto.SystemConfigResponse `json:"config"`
	}

	var envelope importEnvelope
	if err := json.Unmarshal(payload, &envelope); err != nil {
		return dto.SystemConfigImportRequest{}, errors.New("invalid import payload")
	}
	if envelope.Config != nil {
		return dto.SystemConfigImportRequest{
			Version: envelope.Version,
			Config:  *envelope.Config,
		}, nil
	}

	var configPayload dto.SystemConfigResponse
	if err := json.Unmarshal(payload, &configPayload); err != nil {
		return dto.SystemConfigImportRequest{}, errors.New("invalid import payload")
	}
	if !hasConfigContent(configPayload) {
		return dto.SystemConfigImportRequest{}, errors.New("config payload is required")
	}

	return dto.SystemConfigImportRequest{
		Version: dto.ConfigExportVersion,
		Config:  configPayload,
	}, nil
}

func hasConfigContent(configPayload dto.SystemConfigResponse) bool {
	return configPayload.Watchers != nil ||
		configPayload.Targets != nil ||
		configPayload.Presets != nil ||
		configPayload.Keywords != nil
}

func normalizeSystemConfig(configPayload dto.SystemConfigResponse) dto.SystemConfigResponse {
	if configPayload.Watchers == nil {
		configPayload.Watchers = []string{}
	}
	if configPayload.Targets == nil {
		configPayload.Targets = []dto.TargetDTO{}
	}
	if configPayload.Presets == nil {
		configPayload.Presets = []dto.PresetDTO{}
	}
	if configPayload.Keywords == nil {
		configPayload.Keywords = []dto.KeywordDTO{}
	}
	return configPayload
}

func sanitizeSystemConfig(configPayload dto.SystemConfigResponse) dto.SystemConfigResponse {
	for i := range configPayload.Watchers {
		configPayload.Watchers[i] = strings.TrimSpace(configPayload.Watchers[i])
	}

	for i := range configPayload.Targets {
		configPayload.Targets[i].ID = strings.TrimSpace(configPayload.Targets[i].ID)
		configPayload.Targets[i].Name = strings.TrimSpace(configPayload.Targets[i].Name)
		configPayload.Targets[i].Path = strings.TrimSpace(configPayload.Targets[i].Path)
		configPayload.Targets[i].Icon = strings.TrimSpace(configPayload.Targets[i].Icon)
	}

	for i := range configPayload.Presets {
		configPayload.Presets[i].ID = strings.TrimSpace(configPayload.Presets[i].ID)
		configPayload.Presets[i].Name = strings.TrimSpace(configPayload.Presets[i].Name)
		configPayload.Presets[i].Icon = strings.TrimSpace(configPayload.Presets[i].Icon)
		configPayload.Presets[i].Color = strings.TrimSpace(configPayload.Presets[i].Color)
		configPayload.Presets[i].TargetSubPath = strings.TrimSpace(configPayload.Presets[i].TargetSubPath)
		configPayload.Presets[i].DefaultPrefix = strings.TrimSpace(configPayload.Presets[i].DefaultPrefix)
	}

	for i := range configPayload.Keywords {
		configPayload.Keywords[i].ID = strings.TrimSpace(configPayload.Keywords[i].ID)
		configPayload.Keywords[i].Name = strings.TrimSpace(configPayload.Keywords[i].Name)
	}

	return configPayload
}

func (h *SystemHandler) validateImportConfig(configPayload dto.SystemConfigResponse) *response.APIError {
	watcherSet := make(map[string]struct{}, len(configPayload.Watchers))
	for _, watcherPath := range configPayload.Watchers {
		if watcherPath == "" {
			return response.BadRequest(errors.New("watcher path is required"))
		}
		if _, exists := watcherSet[watcherPath]; exists {
			return response.BadRequest(fmt.Errorf("duplicate watcher path: %s", watcherPath))
		}
		watcherSet[watcherPath] = struct{}{}
		if !security.ValidatePath(watcherPath, h.cfg.AllowedRootPaths) {
			return response.Forbidden("path not allowed")
		}
		info, err := os.Stat(watcherPath)
		if err != nil || !info.IsDir() {
			return response.BadRequest(fmt.Errorf("watcher path must be an existing directory: %s", watcherPath))
		}
	}

	targetIDSet := make(map[string]struct{}, len(configPayload.Targets))
	for idx, target := range configPayload.Targets {
		if target.Name == "" || target.Path == "" {
			return response.BadRequest(fmt.Errorf("target[%d] name and path are required", idx))
		}
		if target.ID != "" {
			if _, exists := targetIDSet[target.ID]; exists {
				return response.BadRequest(fmt.Errorf("duplicate target id: %s", target.ID))
			}
			targetIDSet[target.ID] = struct{}{}
		}
		if !security.ValidatePath(target.Path, h.cfg.AllowedRootPaths) {
			return response.Forbidden("path not allowed")
		}
	}

	presetIDSet := make(map[string]struct{}, len(configPayload.Presets))
	for idx, preset := range configPayload.Presets {
		if preset.Name == "" {
			return response.BadRequest(fmt.Errorf("preset[%d] name is required", idx))
		}
		if preset.ID != "" {
			if _, exists := presetIDSet[preset.ID]; exists {
				return response.BadRequest(fmt.Errorf("duplicate preset id: %s", preset.ID))
			}
			presetIDSet[preset.ID] = struct{}{}
		}
	}

	keywordIDSet := make(map[string]struct{}, len(configPayload.Keywords))
	for idx, keyword := range configPayload.Keywords {
		if keyword.Name == "" {
			return response.BadRequest(fmt.Errorf("keyword[%d] name is required", idx))
		}
		if keyword.ID != "" {
			if _, exists := keywordIDSet[keyword.ID]; exists {
				return response.BadRequest(fmt.Errorf("duplicate keyword id: %s", keyword.ID))
			}
			keywordIDSet[keyword.ID] = struct{}{}
		}
	}

	return nil
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
