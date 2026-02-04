package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"sortflow/internal/api/response"
	"sortflow/internal/model"
)

type TaskHandler struct {
	db *gorm.DB
}

func NewTaskHandler(db *gorm.DB) *TaskHandler {
	return &TaskHandler{db: db}
}

func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")

	var task model.Task
	if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.AbortWithError(c, response.NotFound("task not found"))
			return
		}
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) StreamTask(c *gin.Context) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(_ *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	taskID := c.Param("id")
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		var task model.Task
		if err := h.db.First(&task, "id = ?", taskID).Error; err != nil {
			conn.WriteJSON(gin.H{"error": "task not found"})
			return
		}

		if err := conn.WriteJSON(task); err != nil {
			return
		}

		if task.Status == "completed" || task.Status == "failed" {
			return
		}
	}
}
