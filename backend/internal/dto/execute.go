package dto

type OrganizeAction struct {
	SourcePath string `json:"sourcePath"`
	TargetPath string `json:"targetPath"`
	Operation  string `json:"operation"` // move/copy
}

type ExecuteRequest struct {
	Actions      []OrganizeAction `json:"actions"`
	Action       string           `json:"action"`
	PresetID     string           `json:"presetId"`
	TargetRootID string           `json:"targetRootId"`
	TargetPath   string           `json:"targetPath"`
}

type ExecuteResponse struct {
	TaskID string `json:"taskId"`
}
