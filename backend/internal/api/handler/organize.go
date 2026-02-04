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

type OrganizeHandler struct {
	engine *service.ExecutionEngine
	cfg    *config.Config
}

func NewOrganizeHandler(engine *service.ExecutionEngine, cfg *config.Config) *OrganizeHandler {
	return &OrganizeHandler{
		engine: engine,
		cfg:    cfg,
	}
}

func (h *OrganizeHandler) Execute(c *gin.Context) {
	var request dto.ExecuteRequest
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
	for _, action := range request.Actions {
		if action.SourcePath == "" || action.TargetPath == "" {
			response.AbortWithError(c, response.BadRequest(errors.New("sourcePath and targetPath are required")))
			return
		}
		if !security.ValidatePath(action.SourcePath, h.cfg.AllowedRootPaths) || !security.ValidatePath(action.TargetPath, h.cfg.AllowedRootPaths) {
			response.AbortWithError(c, response.Forbidden("path not allowed"))
			return
		}
	}

	if request.Action == "" && len(request.Actions) > 0 {
		request.Action = request.Actions[0].Operation
	}

	task, err := h.engine.CreateTask()
	if err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	if err := h.engine.Execute(task.ID, request); err != nil {
		response.AbortWithError(c, response.Internal(err))
		return
	}

	c.JSON(http.StatusAccepted, dto.ExecuteResponse{TaskID: task.ID})
}
