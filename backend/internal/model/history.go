package model

import "time"

type History struct {
	ID            string    `gorm:"primaryKey"`
	Timestamp     time.Time `gorm:"autoCreateTime"`
	Action        string
	FileCount     int
	PresetID      string
	TargetRootID  string
	TargetPath    string
	Status        string
	CanUndo       bool
	UndoExpiresAt time.Time
	Files         []HistoryFile `gorm:"foreignKey:HistoryID"`
}

type HistoryFile struct {
	ID           uint   `gorm:"primaryKey;autoIncrement"`
	HistoryID    string `gorm:"index"`
	Operation    string
	OriginalPath string
	OriginalName string
	NewPath      string
	NewName      string
	Status       string
}
