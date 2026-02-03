package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"sortflow/internal/config"
	"sortflow/internal/dto"
	"sortflow/internal/pkg/security"
	"sortflow/internal/pkg/thumbnail"
	"sortflow/internal/service"
)

type FileHandler struct {
	cfg *config.Config
}

func NewFileHandler(cfg *config.Config) *FileHandler {
	return &FileHandler{cfg: cfg}
}

func (h *FileHandler) ListFiles(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}
	if !security.ValidatePath(path, h.cfg.AllowedRootPaths) {
		c.JSON(http.StatusForbidden, gin.H{"error": "path not allowed"})
		return
	}

	recursive, _ := strconv.ParseBool(c.DefaultQuery("recursive", "false"))
	files, err := service.ScanDirectory(path, recursive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *FileHandler) Thumbnail(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}
	if !security.ValidatePath(path, h.cfg.AllowedRootPaths) {
		c.JSON(http.StatusForbidden, gin.H{"error": "path not allowed"})
		return
	}

	data, err := thumbnail.GenerateThumbnail(path, h.cfg.ThumbnailSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "image/webp", data)
}

func (h *FileHandler) Metadata(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "path is required"})
		return
	}
	if !security.ValidatePath(path, h.cfg.AllowedRootPaths) {
		c.JSON(http.StatusForbidden, gin.H{"error": "path not allowed"})
		return
	}

	attributes, err := service.ExtractMetadata(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.MetadataResponse{
		Path:       path,
		Attributes: attributes,
	})
}
