package api

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sortflow/internal/api/handler"
	"sortflow/internal/config"
)

func RegisterRoutes(r *gin.Engine, cfg *config.Config, db *gorm.DB) {
	fileHandler := handler.NewFileHandler(cfg)
	previewHandler := handler.NewPreviewHandler()
	organizeHandler := handler.NewOrganizeHandler(db)
	taskHandler := handler.NewTaskHandler(db)
	systemHandler := handler.NewSystemHandler(db)

	r.GET("/files/list", fileHandler.ListFiles)
	r.GET("/files/thumbnail", fileHandler.Thumbnail)

	r.POST("/preview", previewHandler.GeneratePreview)

	r.POST("/organize/execute", organizeHandler.Execute)

	r.GET("/tasks/:id", taskHandler.GetTask)

	r.GET("/system/config", systemHandler.GetConfig)
}
