package service

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"sortflow/internal/dto"
)

type PreviewEngine struct{}

func NewPreviewEngine() *PreviewEngine {
	return &PreviewEngine{}
}

func (e *PreviewEngine) GeneratePreview(files []dto.FileInfo, rules dto.RenameRules, targetPath string) []dto.PreviewResult {
	nameMap := make(map[string]int)
	results := make([]dto.PreviewResult, 0, len(files))

	for _, file := range files {
		newName := e.buildName(file, rules)

		if count, exists := nameMap[newName]; exists {
			nameMap[newName] = count + 1
			newName = e.addSuffix(newName, count+1)
		} else {
			nameMap[newName] = 0
		}

		fullPath := filepath.Join(targetPath, newName)
		status := "ready"
		reason := ""

		if _, err := os.Stat(fullPath); err == nil {
			newName = e.findAvailableName(targetPath, newName)
			status = "auto_renamed"
			reason = "disk_conflict"
		}

		results = append(results, dto.PreviewResult{
			FileID:       file.ID,
			NewName:      newName,
			Status:       status,
			StatusReason: reason,
		})
	}

	return results
}

func (e *PreviewEngine) buildName(file dto.FileInfo, rules dto.RenameRules) string {
	base := file.Name
	if !rules.UseOriginal {
		base = strings.TrimSuffix(file.Name, filepath.Ext(file.Name))
	}
	name := fmt.Sprintf("%s%s%s", rules.Prefix, base, rules.Suffix)
	return name + filepath.Ext(file.Name)
}

func (e *PreviewEngine) addSuffix(name string, count int) string {
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	return fmt.Sprintf("%s_%d%s", base, count, ext)
}

func (e *PreviewEngine) findAvailableName(targetPath, name string) string {
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	for i := 1; i < 10000; i++ {
		candidate := fmt.Sprintf("%s_%d%s", base, i, ext)
		if _, err := os.Stat(filepath.Join(targetPath, candidate)); os.IsNotExist(err) {
			return candidate
		}
	}
	return name
}
