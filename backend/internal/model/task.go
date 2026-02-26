package model

import "time"

type Task struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Status    string    `json:"status"`
	Progress  float64   `json:"progress"`
	Logs      string    `json:"logs"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}
