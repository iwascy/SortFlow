package model

import "time"

type Task struct {
	ID        string `gorm:"primaryKey"`
	Status    string
	Progress  float64
	Logs      string
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}
