package model

type SourceWatcher struct {
	ID   uint   `gorm:"primaryKey;autoIncrement"`
	Path string `gorm:"uniqueIndex"`
}
