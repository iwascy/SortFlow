package dto

type SystemConfigResponse struct {
	Watchers []string    `json:"watchers"`
	Targets  []TargetDTO `json:"targets"`
	Presets  []PresetDTO `json:"presets"`
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
