package service

import (
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"sortflow/internal/model"
)

type HashIndexService struct {
	db *gorm.DB
}

func NewHashIndexService(db *gorm.DB) *HashIndexService {
	return &HashIndexService{db: db}
}

func (s *HashIndexService) EnsureHash(path string) (model.FileHash, error) {
	info, err := os.Stat(path)
	if err != nil {
		return model.FileHash{}, err
	}

	var record model.FileHash
	if err := s.db.First(&record, "path = ?", path).Error; err == nil {
		if record.Size == info.Size() && record.ModTime.Equal(info.ModTime()) {
			return record, nil
		}
	}

	hashValue, err := computeMD5(path)
	if err != nil {
		return model.FileHash{}, err
	}

	record = model.FileHash{
		Path:    path,
		Hash:    hashValue,
		Size:    info.Size(),
		ModTime: info.ModTime(),
	}

	if err := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "path"}},
		DoUpdates: clause.AssignmentColumns([]string{"hash", "size", "mod_time", "updated"}),
	}).Create(&record).Error; err != nil {
		return model.FileHash{}, err
	}

	return record, nil
}

func (s *HashIndexService) SaveWithInfo(path, hash string, info os.FileInfo) error {
	if info == nil {
		stat, err := os.Stat(path)
		if err != nil {
			return err
		}
		info = stat
	}

	record := model.FileHash{
		Path:    path,
		Hash:    hash,
		Size:    info.Size(),
		ModTime: info.ModTime(),
	}

	return s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "path"}},
		DoUpdates: clause.AssignmentColumns([]string{"hash", "size", "mod_time", "updated"}),
	}).Create(&record).Error
}

func (s *HashIndexService) Delete(path string) error {
	return s.db.Where("path = ?", path).Delete(&model.FileHash{}).Error
}

func computeMD5(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := md5.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}
	return hex.EncodeToString(hasher.Sum(nil)), nil
}
