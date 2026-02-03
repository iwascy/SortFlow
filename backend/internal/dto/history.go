package dto

import "time"

type HistorySummary struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Action    string    `json:"action"`
	FileCount int       `json:"fileCount"`
	Status    string    `json:"status"`
}

type HistoryFileDTO struct {
	ID           uint   `json:"id"`
	OriginalPath string `json:"originalPath"`
	OriginalName string `json:"originalName"`
	NewPath      string `json:"newPath"`
	NewName      string `json:"newName"`
	Status       string `json:"status"`
}

type HistoryDetailResponse struct {
	ID            string           `json:"id"`
	Timestamp     time.Time        `json:"timestamp"`
	Action        string           `json:"action"`
	FileCount     int              `json:"fileCount"`
	PresetID      string           `json:"presetId"`
	TargetRootID  string           `json:"targetRootId"`
	TargetPath    string           `json:"targetPath"`
	Status        string           `json:"status"`
	CanUndo       bool             `json:"canUndo"`
	UndoExpiresAt time.Time        `json:"undoExpiresAt"`
	Files         []HistoryFileDTO `json:"files"`
}

type HistoryListResponse struct {
	Items    []HistorySummary `json:"items"`
	Page     int              `json:"page"`
	PageSize int              `json:"pageSize"`
	Total    int64            `json:"total"`
}
