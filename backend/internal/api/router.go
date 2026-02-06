package api

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/api/handler"
	"sortflow/internal/config"
	"sortflow/internal/service"
)

func RegisterRoutes(r *gin.Engine, cfg *config.Config, db *gorm.DB) {
	fileHandler := handler.NewFileHandler(cfg)
	previewHandler := handler.NewPreviewHandler(cfg)
	executionEngine := service.NewExecutionEngine(db, cfg.AllowedRootPaths)
	organizeHandler := handler.NewOrganizeHandler(executionEngine, cfg)
	taskHandler := handler.NewTaskHandler(db, executionEngine)
	systemHandler := handler.NewSystemHandler(db, cfg)
	historyHandler := handler.NewHistoryHandler(db)

	r.GET("/files/list", fileHandler.ListFiles)
	r.GET("/files/thumbnail", fileHandler.Thumbnail)
	r.GET("/files/content", fileHandler.Content)
	r.GET("/files/metadata", fileHandler.Metadata)

	r.POST("/preview", previewHandler.GeneratePreview)

	r.POST("/organize/execute", organizeHandler.Execute)

	r.GET("/tasks/:id", taskHandler.GetTask)
	r.GET("/ws/tasks/:id", taskHandler.StreamTask)
	r.POST("/tasks/:id/cancel", taskHandler.CancelTask)

	r.GET("/system/config", systemHandler.GetConfig)
	r.POST("/system/watchers", systemHandler.AddWatcher)
	r.DELETE("/system/watchers", systemHandler.RemoveWatcher)
	r.POST("/system/presets", systemHandler.CreatePreset)
	r.PUT("/system/presets/:id", systemHandler.UpdatePreset)
	r.DELETE("/system/presets/:id", systemHandler.DeletePreset)
	r.PUT("/system/presets/reorder", systemHandler.ReorderPresets)
	r.POST("/system/targets", systemHandler.CreateTarget)
	r.PUT("/system/targets/:id", systemHandler.UpdateTarget)
	r.DELETE("/system/targets/:id", systemHandler.DeleteTarget)
	r.POST("/system/video-covers/generate", systemHandler.GenerateVideoCovers)

	r.GET("/history", historyHandler.ListHistories)
	r.GET("/history/:id", historyHandler.GetHistory)
	r.POST("/history/:id/undo", historyHandler.UndoHistory)
	r.DELETE("/history", historyHandler.DeleteHistory)
}
