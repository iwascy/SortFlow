package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/dto"
	"sortflow/internal/service"
)

type OrganizeHandler struct {
	engine *service.ExecutionEngine
}

func NewOrganizeHandler(db *gorm.DB) *OrganizeHandler {
	return &OrganizeHandler{engine: service.NewExecutionEngine(db)}
}

func (h *OrganizeHandler) Execute(c *gin.Context) {
	var request dto.ExecuteRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.engine.CreateTask()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.engine.Execute(task.ID, request.Actions)

	c.JSON(http.StatusAccepted, dto.ExecuteResponse{TaskID: task.ID})
}
