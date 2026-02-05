package thumbnail

import (
	"bytes"
	"fmt"
	"image"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
)

type cacheEntry struct {
	modTime time.Time
	size    int
	data    []byte
}

var (
	thumbCache   = map[string]cacheEntry{}
	thumbCacheMu sync.Mutex
	videoExtSet  = map[string]struct{}{
		"mp4": {}, "mov": {}, "m4v": {}, "mkv": {}, "avi": {}, "webm": {}, "wmv": {},
		"flv": {}, "mpg": {}, "mpeg": {}, "3gp": {}, "3g2": {}, "mts": {}, "m2ts": {},
		"vob": {}, "hevc": {}, "h265": {}, "h264": {},
	}
)

func GenerateThumbnail(path string, size int) ([]byte, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	cacheKey := fmt.Sprintf("%s:%d", path, size)
	thumbCacheMu.Lock()
	if entry, ok := thumbCache[cacheKey]; ok {
		if entry.modTime.Equal(info.ModTime()) && entry.size == size {
			data := make([]byte, len(entry.data))
			copy(data, entry.data)
			thumbCacheMu.Unlock()
			return data, nil
		}
	}
	thumbCacheMu.Unlock()

	img, err := loadImageForThumbnail(path)
	if err != nil {
		return nil, err
	}

	thumb := imaging.Fit(img, size, size, imaging.Lanczos)

	var buf bytes.Buffer
	if err := webp.Encode(&buf, thumb, &webp.Options{Lossless: false, Quality: 85}); err != nil {
		return nil, fmt.Errorf("encode webp: %w", err)
	}

	data := buf.Bytes()
	thumbCacheMu.Lock()
	thumbCache[cacheKey] = cacheEntry{
		modTime: info.ModTime(),
		size:    size,
		data:    append([]byte(nil), data...),
	}
	thumbCacheMu.Unlock()

	return data, nil
}

func IsVideoFile(path string) bool {
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(path)), ".")
	_, ok := videoExtSet[ext]
	return ok
}

func loadImageForThumbnail(path string) (image.Image, error) {
	if IsVideoFile(path) {
		return decodeVideoCover(path)
	}

	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	img, err := imaging.Decode(file, imaging.AutoOrientation(true))
	if err != nil {
		return nil, err
	}

	return img, nil
}

func decodeVideoCover(path string) (image.Image, error) {
	ffmpegBin := resolveFFmpegPath()
	cmd := exec.Command(
		ffmpegBin,
		"-hide_banner",
		"-loglevel", "error",
		"-ss", "00:00:01",
		"-i", path,
		"-frames:v", "1",
		"-f", "image2pipe",
		"-vcodec", "png",
		"pipe:1",
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	img, decodeErr := imaging.Decode(out)
	_, _ = io.Copy(io.Discard, out)
	waitErr := cmd.Wait()

	if decodeErr != nil {
		return nil, fmt.Errorf("decode video frame: %w", decodeErr)
	}
	if waitErr != nil {
		return nil, fmt.Errorf("ffmpeg failed: %w (%s)", waitErr, strings.TrimSpace(stderr.String()))
	}

	return img, nil
}

func resolveFFmpegPath() string {
	candidates := []string{
		filepath.Join("..", "bin", "ffmpeg"),
		filepath.Join("bin", "ffmpeg"),
	}

	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
	}

	return "ffmpeg"
}

func GenerateThumbnailFromImage(img image.Image, size int) ([]byte, error) {
	thumb := imaging.Fit(img, size, size, imaging.Lanczos)

	var buf bytes.Buffer
	if err := webp.Encode(&buf, thumb, &webp.Options{Lossless: false, Quality: 85}); err != nil {
		return nil, fmt.Errorf("encode webp: %w", err)
	}

	return buf.Bytes(), nil
}
