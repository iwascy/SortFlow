package config

import (
	"sortflow/internal/model"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func InitDB(dbPath string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&model.SourceWatcher{},
		&model.TargetRoot{},
		&model.Preset{},
		&model.Keyword{},
		&model.History{},
		&model.HistoryFile{},
		&model.Task{},
		&model.FileHash{},
	); err != nil {
		return nil, err
	}

	return db, nil
}
