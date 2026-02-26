package model

import "time"

// FileHash stores hashed metadata for a file path so the backend can reuse
// previous calculations when checking duplicates.
type FileHash struct {
	Path    string `gorm:"primaryKey"`
	Hash    string `gorm:"index"`
	Size    int64
	ModTime time.Time
	Updated time.Time `gorm:"autoUpdateTime"`
	Created time.Time `gorm:"autoCreateTime"`
}
