package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

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

	response, err := h.service.ListHistories(page, pageSize, action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *HistoryHandler) GetHistory(c *gin.Context) {
	history, err := h.service.GetHistory(c.Param("id"))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "history not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, history)
}

func (h *HistoryHandler) UndoHistory(c *gin.Context) {
	if err := h.service.UndoHistory(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HistoryHandler) DeleteHistory(c *gin.Context) {
	before := c.Query("before")
	if before == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "before is required"})
		return
	}
	cutoff, err := time.Parse(time.RFC3339, before)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid before timestamp"})
		return
	}

	count, err := h.service.DeleteBefore(cutoff)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
