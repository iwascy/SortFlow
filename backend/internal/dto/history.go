package dto

import "time"

type HistorySummary struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Action    string    `json:"action"`
	FileCount int       `json:"fileCount"`
	Status    string    `json:"status"`
}
