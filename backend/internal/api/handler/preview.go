package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"sortflow/internal/api/response"
	"sortflow/internal/config"
	"sortflow/internal/dto"
	"sortflow/internal/pkg/security"
	"sortflow/internal/service"
)

type PreviewHandler struct {
	engine *service.PreviewEngine
	cfg    *config.Config
}

func NewPreviewHandler(cfg *config.Config) *PreviewHandler {
	return &PreviewHandler{
		engine: service.NewPreviewEngine(),
		cfg:    cfg,
	}
}

func (h *PreviewHandler) GeneratePreview(c *gin.Context) {
	var request dto.PreviewRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}

	if request.TargetPath == "" {
		response.AbortWithError(c, response.BadRequest(errors.New("targetPath is required")))
		return
	}

	if !security.ValidatePath(request.TargetPath, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	results := h.engine.GeneratePreview(request.Files, request.Rules, request.TargetPath)
	c.JSON(http.StatusOK, dto.PreviewResponse{Results: results})
}
