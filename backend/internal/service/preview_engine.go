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
	reserved := make(map[string]struct{})
	results := make([]dto.PreviewResult, 0, len(files))

	for _, file := range files {
		baseName := e.buildName(file, rules)
		newName, diskConflict := e.allocateName(targetPath, baseName, reserved)

		status := "ready"
		reason := ""
		if diskConflict {
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
	if rules.UseOriginal {
		return file.Name
	}

	base := strings.TrimSuffix(file.Name, filepath.Ext(file.Name))
	name := fmt.Sprintf("%s%s%s", rules.Prefix, base, rules.Suffix)
	return name + filepath.Ext(file.Name)
}

func (e *PreviewEngine) addSuffix(name string, count int) string {
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	return fmt.Sprintf("%s_%d%s", base, count, ext)
}

func (e *PreviewEngine) allocateName(targetPath, baseName string, reserved map[string]struct{}) (string, bool) {
	diskConflict := false
	for i := 0; i < 10000; i++ {
		candidate := baseName
		if i > 0 {
			candidate = e.addSuffix(baseName, i)
		}
		if _, exists := reserved[candidate]; exists {
			continue
		}

		fullPath := filepath.Join(targetPath, candidate)
		if _, err := os.Stat(fullPath); err == nil {
			diskConflict = true
			continue
		} else if err != nil && !os.IsNotExist(err) {
			diskConflict = true
			continue
		}

		reserved[candidate] = struct{}{}
		return candidate, diskConflict
	}

	reserved[baseName] = struct{}{}
	return baseName, diskConflict
}
