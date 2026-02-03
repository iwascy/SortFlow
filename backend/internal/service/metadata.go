package service

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/rwcarlsen/goexif/exif"
)

func ExtractMetadata(path string) (map[string]string, error) {
	attributes := map[string]string{}

	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	attributes["size"] = strconv.FormatInt(info.Size(), 10)
	attributes["modTime"] = info.ModTime().Format(time.RFC3339)

	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	exifData, err := exif.Decode(file)
	if err != nil {
		return attributes, nil
	}

	if tag, err := exifData.Get(exif.DateTime); err == nil {
		if value, err := tag.StringVal(); err == nil {
			attributes["dateTime"] = value
		}
	}
	if tag, err := exifData.Get(exif.Make); err == nil {
		if value, err := tag.StringVal(); err == nil {
			attributes["cameraMake"] = value
		}
	}
	if tag, err := exifData.Get(exif.Model); err == nil {
		if value, err := tag.StringVal(); err == nil {
			attributes["cameraModel"] = value
		}
	}
	if tag, err := exifData.Get(exif.LensModel); err == nil {
		if value, err := tag.StringVal(); err == nil {
			attributes["lensModel"] = value
		}
	}

	if focal, err := exifData.Get(exif.FocalLength); err == nil {
		attributes["focalLength"] = fmt.Sprintf("%v", focal)
	}

	return attributes, nil
}
