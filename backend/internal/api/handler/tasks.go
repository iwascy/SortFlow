package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"sortflow/internal/api/response"
	"sortflow/internal/model"
	"sortflow/internal/service"
)

type TaskHandler struct {
	db     *gorm.DB
	engine *service.ExecutionEngine
}

func NewTaskHandler(db *gorm.DB, engine *service.ExecutionEngine) *TaskHandler {
	return &TaskHandler{db: db, engine: engine}
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

		if task.Status == "completed" || task.Status == "failed" || task.Status == "cancelled" {
			return
		}
	}
}

func (h *TaskHandler) CancelTask(c *gin.Context) {
	taskID := c.Param("id")

	if err := h.engine.CancelTask(taskID); err != nil {
		if errors.Is(err, service.ErrTaskNotFound) {
			response.AbortWithError(c, response.NotFound("task not found"))
			return
		}
		if errors.Is(err, service.ErrTaskNotRunning) {
			response.AbortWithError(c, response.BadRequest(err))
			return
		}
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.Status(http.StatusNoContent)
}
