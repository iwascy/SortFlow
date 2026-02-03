package thumbnail

import (
	"bytes"
	"fmt"
	"image"
	"os"
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

	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	img, err := imaging.Decode(file, imaging.AutoOrientation(true))
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

func GenerateThumbnailFromImage(img image.Image, size int) ([]byte, error) {
	thumb := imaging.Fit(img, size, size, imaging.Lanczos)

	var buf bytes.Buffer
	if err := webp.Encode(&buf, thumb, &webp.Options{Lossless: false, Quality: 85}); err != nil {
		return nil, fmt.Errorf("encode webp: %w", err)
	}

	return buf.Bytes(), nil
}
