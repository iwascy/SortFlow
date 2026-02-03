package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"sortflow/internal/model"
)

func TestHistoryHandlerListHistoriesEmpty(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := newHandlerTestDB(t)

	router := gin.New()
	handler := NewHistoryHandler(db)
	router.GET("/history", handler.ListHistories)

	recorder := httptest.NewRecorder()
	request, err := http.NewRequest(http.MethodGet, "/history", nil)
	if err != nil {
		t.Fatalf("failed to build request: %v", err)
	}

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}
}

func newHandlerTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}
	if err := db.AutoMigrate(&model.History{}, &model.HistoryFile{}); err != nil {
		t.Fatalf("failed to migrate db: %v", err)
	}
	return db
}
