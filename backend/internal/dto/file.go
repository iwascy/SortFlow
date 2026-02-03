package dto

import "time"

type FileInfo struct {
	ID      string    `json:"id"`
	Name    string    `json:"name"`
	Path    string    `json:"path"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"modTime"`
	IsDir   bool      `json:"isDir"`
}

type ListFilesResponse struct {
	Files []FileInfo `json:"files"`
}

type MetadataResponse struct {
	Path       string            `json:"path"`
	Attributes map[string]string `json:"attributes"`
}
