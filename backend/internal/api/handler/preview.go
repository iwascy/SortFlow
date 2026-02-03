package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"sortflow/internal/dto"
	"sortflow/internal/service"
)

type PreviewHandler struct {
	engine *service.PreviewEngine
}

func NewPreviewHandler() *PreviewHandler {
	return &PreviewHandler{engine: service.NewPreviewEngine()}
}

func (h *PreviewHandler) GeneratePreview(c *gin.Context) {
	var request dto.PreviewRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results := h.engine.GeneratePreview(request.Files, request.Rules, request.TargetPath)
	c.JSON(http.StatusOK, dto.PreviewResponse{Results: results})
}
