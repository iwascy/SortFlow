package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/api/response"
	"sortflow/internal/service"
)

type HistoryHandler struct {
	service *service.HistoryService
}

func NewHistoryHandler(db *gorm.DB) *HistoryHandler {
	return &HistoryHandler{service: service.NewHistoryService(db)}
}

func (h *HistoryHandler) ListHistories(c *gin.Context) {
	page := parseIntQuery(c, "page", 1)
	pageSize := parseIntQuery(c, "pageSize", 20)
	action := c.Query("action")

	result, err := h.service.ListHistories(page, pageSize, action)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *HistoryHandler) GetHistory(c *gin.Context) {
	history, err := h.service.GetHistory(c.Param("id"))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			response.AbortWithError(c, response.NotFound("history not found"))
			return
		}
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, history)
}

func (h *HistoryHandler) UndoHistory(c *gin.Context) {
	if err := h.service.UndoHistory(c.Param("id")); err != nil {
		response.AbortWithError(c, response.BadRequest(err))
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HistoryHandler) DeleteHistory(c *gin.Context) {
	before := c.Query("before")
	if before == "" {
		response.AbortWithError(c, response.BadRequest(errors.New("before is required")))
		return
	}
	cutoff, err := time.Parse(time.RFC3339, before)
	if err != nil {
		response.AbortWithError(c, response.BadRequest(errors.New("invalid before timestamp")))
		return
	}

	count, err := h.service.DeleteBefore(cutoff)
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": count})
}

func parseIntQuery(c *gin.Context, key string, defaultValue int) int {
	value := c.Query(key)
	if value == "" {
		return defaultValue
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return parsed
}
