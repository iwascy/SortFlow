package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"sortflow/internal/config"
	"sortflow/internal/dto"
)

func TestPreviewHandlerGeneratePreview(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	tempDir := t.TempDir()
	handler := NewPreviewHandler(&config.Config{
		AllowedRootPaths: []string{tempDir},
	})
	router.POST("/preview", handler.GeneratePreview)

	request := dto.PreviewRequest{
		Files: []dto.FileInfo{
			{ID: "1", Name: "photo.jpg"},
			{ID: "2", Name: "photo.jpg"},
		},
		Rules:      dto.RenameRules{},
		TargetPath: tempDir,
	}

	body, err := json.Marshal(request)
	if err != nil {
		t.Fatalf("failed to marshal request: %v", err)
	}

	recorder := httptest.NewRecorder()
	httpRequest, err := http.NewRequest(http.MethodPost, "/preview", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("failed to build request: %v", err)
	}
	httpRequest.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, httpRequest)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}

	var response dto.PreviewResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(response.Results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(response.Results))
	}
	if response.Results[0].NewName == response.Results[1].NewName {
		t.Fatalf("expected unique names in response")
	}
}
