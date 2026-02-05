package service

import (
	"os"
	"path/filepath"
	"sortflow/internal/dto"
)

func ScanDirectory(path string, recursive bool) ([]dto.FileInfo, error) {
	entries := []dto.FileInfo{}

	if recursive {
		err := filepath.WalkDir(path, func(current string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			info, err := d.Info()
			if err != nil {
				return err
			}
		entries = append(entries, dto.FileInfo{
			ID:      current,
			Name:    info.Name(),
			Path:    current,
			Size:    info.Size(),
			Created: getCreateTime(info),
			ModTime: info.ModTime(),
			IsDir:   info.IsDir(),
		})
			return nil
		})
		if err != nil {
			return nil, err
		}
		return entries, nil
	}

	items, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		info, err := item.Info()
		if err != nil {
			return nil, err
		}
		entryPath := filepath.Join(path, item.Name())
		entries = append(entries, dto.FileInfo{
			ID:      entryPath,
			Name:    info.Name(),
			Path:    entryPath,
			Size:    info.Size(),
			Created: getCreateTime(info),
			ModTime: info.ModTime(),
			IsDir:   info.IsDir(),
		})
	}

	return entries, nil
}

func GetFileInfo(path string) (dto.FileInfo, error) {
	info, err := os.Stat(path)
	if err != nil {
		return dto.FileInfo{}, err
	}

	return dto.FileInfo{
		ID:      path,
		Name:    info.Name(),
		Path:    path,
		Size:    info.Size(),
		Created: getCreateTime(info),
		ModTime: info.ModTime(),
		IsDir:   info.IsDir(),
	}, nil
}
