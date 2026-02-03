package dto

type OrganizeAction struct {
	SourcePath string `json:"sourcePath"`
	TargetPath string `json:"targetPath"`
	Operation  string `json:"operation"` // move/copy
}

type ExecuteRequest struct {
	Actions []OrganizeAction `json:"actions"`
}

type ExecuteResponse struct {
	TaskID string `json:"taskId"`
}
