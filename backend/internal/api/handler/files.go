package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"sortflow/internal/api/response"
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
		response.AbortWithError(c, response.BadRequest(errors.New("path is required")))
		return
	}
	if !security.ValidatePath(path, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	recursive, _ := strconv.ParseBool(c.DefaultQuery("recursive", "false"))
	files, err := service.ScanDirectory(path, recursive)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *FileHandler) Thumbnail(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		response.AbortWithError(c, response.BadRequest(errors.New("path is required")))
		return
	}
	if !security.ValidatePath(path, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	data, err := thumbnail.GenerateThumbnail(path, h.cfg.ThumbnailSize)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.Data(http.StatusOK, "image/webp", data)
}

func (h *FileHandler) Metadata(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		response.AbortWithError(c, response.BadRequest(errors.New("path is required")))
		return
	}
	if !security.ValidatePath(path, h.cfg.AllowedRootPaths) {
		response.AbortWithError(c, response.Forbidden("path not allowed"))
		return
	}

	attributes, err := service.ExtractMetadata(path)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, dto.MetadataResponse{
		Path:       path,
		Attributes: attributes,
	})
}
