package dto

type DuplicateCheckRequest struct {
	TargetPath string           `json:"targetPath"`
	Actions    []OrganizeAction `json:"actions"`
}

type DuplicateConflict struct {
	SourcePath   string `json:"sourcePath"`
	SourceName   string `json:"sourceName"`
	TargetPath   string `json:"targetPath"`
	ExistingPath string `json:"existingPath"`
	ExistingName string `json:"existingName"`
}

type DuplicateCheckResponse struct {
	Conflicts []DuplicateConflict `json:"conflicts"`
}
