package service

import (
	"testing"

	"sortflow/internal/dto"
	"sortflow/internal/model"
)

func TestConfigServicePresetLifecycle(t *testing.T) {
	db := newTestDB(t)
	service := NewConfigService(db)

	preset, err := service.CreatePreset(dto.PresetRequest{
		Name:          "Vacation",
		Icon:          "photo",
		Color:         "#fff",
		TargetSubPath: "2024",
		DefaultPrefix: "VAC",
		Order:         1,
	})
	if err != nil {
		t.Fatalf("failed to create preset: %v", err)
	}

	updated, err := service.UpdatePreset(preset.ID, dto.PresetRequest{
		Name:          "Vacation Updated",
		Icon:          "photo",
		Color:         "#000",
		TargetSubPath: "2024",
		DefaultPrefix: "VAC",
		Order:         2,
	})
	if err != nil {
		t.Fatalf("failed to update preset: %v", err)
	}
	if updated.Name != "Vacation Updated" {
		t.Fatalf("expected updated preset name, got %s", updated.Name)
	}

	second, err := service.CreatePreset(dto.PresetRequest{
		Name:          "Work",
		Icon:          "briefcase",
		Color:         "#111",
		TargetSubPath: "work",
		DefaultPrefix: "WORK",
		Order:         0,
	})
	if err != nil {
		t.Fatalf("failed to create second preset: %v", err)
	}

	if err := service.ReorderPresets([]string{second.ID, preset.ID}); err != nil {
		t.Fatalf("failed to reorder presets: %v", err)
	}

	var reordered []model.Preset
	if err := db.Order("`order` asc").Find(&reordered).Error; err != nil {
		t.Fatalf("failed to load presets: %v", err)
	}
	if len(reordered) != 2 {
		t.Fatalf("expected 2 presets, got %d", len(reordered))
	}
	if reordered[0].ID != second.ID || reordered[0].Order != 0 {
		t.Fatalf("expected second preset to be first after reorder")
	}

	if err := service.DeletePreset(preset.ID); err != nil {
		t.Fatalf("failed to delete preset: %v", err)
	}

	var remaining int64
	if err := db.Model(&model.Preset{}).Count(&remaining).Error; err != nil {
		t.Fatalf("failed to count presets: %v", err)
	}
	if remaining != 1 {
		t.Fatalf("expected 1 remaining preset, got %d", remaining)
	}
}

func TestConfigServiceTargetsAndWatchers(t *testing.T) {
	db := newTestDB(t)
	service := NewConfigService(db)

	target, err := service.CreateTarget(dto.TargetRequest{
		Name: "NAS",
		Path: "/nas/photos",
		Icon: "folder",
	})
	if err != nil {
		t.Fatalf("failed to create target: %v", err)
	}

	updated, err := service.UpdateTarget(target.ID, dto.TargetRequest{
		Name: "NAS Updated",
		Path: "/nas/photos",
		Icon: "folder",
	})
	if err != nil {
		t.Fatalf("failed to update target: %v", err)
	}
	if updated.Name != "NAS Updated" {
		t.Fatalf("expected updated target name, got %s", updated.Name)
	}

	if err := service.DeleteTarget(target.ID); err != nil {
		t.Fatalf("failed to delete target: %v", err)
	}

	if err := service.AddWatcher("/watch/path"); err != nil {
		t.Fatalf("failed to add watcher: %v", err)
	}
	if err := service.RemoveWatcher("/watch/path"); err != nil {
		t.Fatalf("failed to remove watcher: %v", err)
	}
}
