package web

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"strings"

	"github.com/gin-gonic/gin"
)

var apiPrefixes = []string{
	"/files",
	"/preview",
	"/organize",
	"/tasks",
	"/ws",
	"/system",
	"/history",
}

// RegisterSPARoutes serves built frontend assets and falls back to index.html for SPA routes.
func RegisterSPARoutes(r *gin.Engine) {
	staticFS, hasIndex, sourceRoot := resolveStaticFS()
	httpFS := http.FS(staticFS)
	indexData := []byte(nil)
	if hasIndex {
		if data, err := fs.ReadFile(staticFS, "index.html"); err == nil {
			indexData = data
		} else {
			hasIndex = false
		}
	}

	r.NoRoute(func(c *gin.Context) {
		if isAPIPath(c.Request.URL.Path) {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}

		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}

		if !hasIndex {
			c.String(http.StatusServiceUnavailable, "frontend bundle missing: build frontend assets first (checked %s)", sourceRoot)
			return
		}

		requestPath := strings.TrimPrefix(path.Clean(c.Request.URL.Path), "/")
		if requestPath == "." || requestPath == "" {
			c.Data(http.StatusOK, "text/html; charset=utf-8", indexData)
			return
		}

		if exists, isDir := fileExists(staticFS, requestPath); exists && !isDir {
			c.FileFromFS(requestPath, httpFS)
			return
		}

		c.Data(http.StatusOK, "text/html; charset=utf-8", indexData)
	})
}

func resolveStaticFS() (fs.FS, bool, string) {
	candidates := []string{
		strings.TrimSpace(os.Getenv("WEB_ROOT")),
		"/app/web",
		"web",
		"../frontend/dist",
		"../../frontend/dist",
	}

	for _, root := range candidates {
		if root == "" {
			continue
		}

		fsys := os.DirFS(root)
		if exists, isDir := fileExists(fsys, "index.html"); exists && !isDir {
			return fsys, true, root
		}
	}

	return os.DirFS("."), false, fmt.Sprintf("%v", candidates)
}

func isAPIPath(requestPath string) bool {
	for _, prefix := range apiPrefixes {
		if requestPath == prefix || strings.HasPrefix(requestPath, prefix+"/") {
			return true
		}
	}
	return false
}

func fileExists(fsRoot fs.FS, target string) (exists bool, isDir bool) {
	info, err := fs.Stat(fsRoot, target)
	if err != nil {
		return false, false
	}
	return true, info.IsDir()
}
