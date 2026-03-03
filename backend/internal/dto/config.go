package dto

type SystemConfigResponse struct {
	Watchers []string     `json:"watchers"`
	Targets  []TargetDTO  `json:"targets"`
	Presets  []PresetDTO  `json:"presets"`
	Keywords []KeywordDTO `json:"keywords"`
}

const ConfigExportVersion = 1

type SystemConfigExportResponse struct {
	Version    int                  `json:"version"`
	ExportedAt string               `json:"exportedAt"`
	Config     SystemConfigResponse `json:"config"`
}

type SystemConfigImportRequest struct {
	Version int                  `json:"version"`
	Config  SystemConfigResponse `json:"config"`
}

type TargetDTO struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path"`
	Icon string `json:"icon"`
}

type PresetDTO struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Icon          string `json:"icon"`
	Color         string `json:"color"`
	TargetSubPath string `json:"targetSubPath"`
	DefaultPrefix string `json:"defaultPrefix"`
	Order         int    `json:"order"`
}

type KeywordDTO struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Order int    `json:"order"`
}

type WatcherRequest struct {
	Path string `json:"path" binding:"required"`
}

type PresetRequest struct {
	Name          string `json:"name" binding:"required"`
	Icon          string `json:"icon"`
	Color         string `json:"color"`
	TargetSubPath string `json:"targetSubPath"`
	DefaultPrefix string `json:"defaultPrefix"`
	Order         int    `json:"order"`
}

type KeywordRequest struct {
	Name  string `json:"name" binding:"required"`
	Order int    `json:"order"`
}

type PresetReorderRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

type TargetRequest struct {
	Name string `json:"name" binding:"required"`
	Path string `json:"path" binding:"required"`
	Icon string `json:"icon"`
}
