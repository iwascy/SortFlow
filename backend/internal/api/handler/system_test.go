package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"sortflow/internal/api/middleware"
	"sortflow/internal/config"
	"sortflow/internal/dto"
	"sortflow/internal/model"
)

func TestSystemHandlerImportAndExportConfig(t *testing.T) {
	gin.SetMode(gin.TestMode)

	rootDir := t.TempDir()
	watcherDir := filepath.Join(rootDir, "watcher")
	if err := os.MkdirAll(watcherDir, 0o755); err != nil {
		t.Fatalf("failed to create watcher dir: %v", err)
	}

	db := newSystemConfigHandlerTestDB(t)
	router := gin.New()
	router.Use(middleware.ErrorHandler())
	handler := NewSystemHandler(db, &config.Config{
		AllowedRootPaths: []string{rootDir},
	})
	router.POST("/system/config/import", handler.ImportConfig)
	router.GET("/system/config/export", handler.ExportConfig)

	importPayload := dto.SystemConfigImportRequest{
		Version: dto.ConfigExportVersion,
		Config: dto.SystemConfigResponse{
			Watchers: []string{watcherDir},
			Targets: []dto.TargetDTO{
				{
					Name: "Media",
					Path: rootDir,
					Icon: "storage",
				},
			},
			Presets: []dto.PresetDTO{
				{
					Name:          "Trips",
					TargetSubPath: "2026",
					DefaultPrefix: "TRIP",
					Order:         1,
				},
			},
			Keywords: []dto.KeywordDTO{
				{
					Name:  "travel",
					Order: 1,
				},
			},
		},
	}

	importBody, err := json.Marshal(importPayload)
	if err != nil {
		t.Fatalf("failed to marshal import payload: %v", err)
	}

	importRecorder := httptest.NewRecorder()
	importRequest, err := http.NewRequest(http.MethodPost, "/system/config/import", bytes.NewReader(importBody))
	if err != nil {
		t.Fatalf("failed to build import request: %v", err)
	}
	importRequest.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(importRecorder, importRequest)

	if importRecorder.Code != http.StatusNoContent {
		t.Fatalf("expected status 204, got %d", importRecorder.Code)
	}

	exportRecorder := httptest.NewRecorder()
	exportRequest, err := http.NewRequest(http.MethodGet, "/system/config/export", nil)
	if err != nil {
		t.Fatalf("failed to build export request: %v", err)
	}
	router.ServeHTTP(exportRecorder, exportRequest)

	if exportRecorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", exportRecorder.Code)
	}

	var exportResponse dto.SystemConfigExportResponse
	if err := json.Unmarshal(exportRecorder.Body.Bytes(), &exportResponse); err != nil {
		t.Fatalf("failed to decode export response: %v", err)
	}
	if exportResponse.Version != dto.ConfigExportVersion {
		t.Fatalf("unexpected export version: %d", exportResponse.Version)
	}
	if len(exportResponse.Config.Watchers) != 1 || exportResponse.Config.Watchers[0] != watcherDir {
		t.Fatalf("unexpected exported watchers: %+v", exportResponse.Config.Watchers)
	}
	if len(exportResponse.Config.Targets) != 1 {
		t.Fatalf("expected 1 target, got %d", len(exportResponse.Config.Targets))
	}
	if len(exportResponse.Config.Presets) != 1 {
		t.Fatalf("expected 1 preset, got %d", len(exportResponse.Config.Presets))
	}
	if len(exportResponse.Config.Keywords) != 1 {
		t.Fatalf("expected 1 keyword, got %d", len(exportResponse.Config.Keywords))
	}
}

func TestSystemHandlerImportConfigRejectsDisallowedPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	allowedRoot := t.TempDir()
	disallowedDir := t.TempDir()

	db := newSystemConfigHandlerTestDB(t)
	router := gin.New()
	router.Use(middleware.ErrorHandler())
	handler := NewSystemHandler(db, &config.Config{
		AllowedRootPaths: []string{allowedRoot},
	})
	router.POST("/system/config/import", handler.ImportConfig)

	importPayload := dto.SystemConfigImportRequest{
		Version: dto.ConfigExportVersion,
		Config: dto.SystemConfigResponse{
			Watchers: []string{disallowedDir},
		},
	}

	importBody, err := json.Marshal(importPayload)
	if err != nil {
		t.Fatalf("failed to marshal import payload: %v", err)
	}

	recorder := httptest.NewRecorder()
	request, err := http.NewRequest(http.MethodPost, "/system/config/import", bytes.NewReader(importBody))
	if err != nil {
		t.Fatalf("failed to build request: %v", err)
	}
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", recorder.Code)
	}
}

func newSystemConfigHandlerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	if err := db.AutoMigrate(
		&model.SourceWatcher{},
		&model.TargetRoot{},
		&model.Preset{},
		&model.Keyword{},
	); err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}
	return db
}
