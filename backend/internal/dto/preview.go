package dto

type RenameRules struct {
	Prefix      string `json:"prefix"`
	Suffix      string `json:"suffix"`
	UseOriginal bool   `json:"useOriginal"`
}

type PreviewRequest struct {
	Files      []FileInfo  `json:"files"`
	Rules      RenameRules `json:"rules"`
	TargetPath string      `json:"targetPath"`
}

type PreviewResult struct {
	FileID       string `json:"fileId"`
	NewName      string `json:"newName"`
	Status       string `json:"status"`
	StatusReason string `json:"statusReason,omitempty"`
}

type PreviewResponse struct {
	Results []PreviewResult `json:"results"`
}
