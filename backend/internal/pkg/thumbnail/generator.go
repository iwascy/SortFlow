package thumbnail

import (
	"bytes"
	"fmt"
	"image"
	"os"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
)

func GenerateThumbnail(path string, size int) ([]byte, error) {
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

	return buf.Bytes(), nil
}

func GenerateThumbnailFromImage(img image.Image, size int) ([]byte, error) {
	thumb := imaging.Fit(img, size, size, imaging.Lanczos)

	var buf bytes.Buffer
	if err := webp.Encode(&buf, thumb, &webp.Options{Lossless: false, Quality: 85}); err != nil {
		return nil, fmt.Errorf("encode webp: %w", err)
	}

	return buf.Bytes(), nil
}
