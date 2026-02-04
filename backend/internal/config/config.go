package config

import (
	"fmt"
	"runtime"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Port             int      `mapstructure:"port"`
	DatabaseURL      string   `mapstructure:"database_url"`
	AllowedRootPaths []string `mapstructure:"allowed_root_paths"`
	ThumbnailSize    int      `mapstructure:"thumbnail_size"`
	ThumbnailFormat  string   `mapstructure:"thumbnail_format"`
}

func Load() *Config {
	defaultRoots := []string{"/nas", "/mnt", "/Volumes", "/Users"}

	viper.SetDefault("port", 8463)
	viper.SetDefault("database_url", "sortflow.db")
	viper.SetDefault("allowed_root_paths", defaultRoots)
	viper.SetDefault("thumbnail_size", 400)
	viper.SetDefault("thumbnail_format", "webp")

	viper.AutomaticEnv()

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return &Config{
			Port:             8000,
			DatabaseURL:      "sortflow.db",
			AllowedRootPaths: defaultRoots,
			ThumbnailSize:    400,
			ThumbnailFormat:  "webp",
		}
	}
	cfg.AllowedRootPaths = normalizeAllowedRootPaths(cfg.AllowedRootPaths)
	if len(cfg.AllowedRootPaths) == 0 {
		cfg.AllowedRootPaths = defaultRoots
	}
	if runtime.GOOS == "darwin" && !containsString(cfg.AllowedRootPaths, "/Users") {
		cfg.AllowedRootPaths = append(cfg.AllowedRootPaths, "/Users")
	}
	return &cfg
}

func (c *Config) ServerAddr() string {
	return fmt.Sprintf(":%d", c.Port)
}

func normalizeAllowedRootPaths(paths []string) []string {
	normalized := make([]string, 0, len(paths))
	for _, path := range paths {
		value := strings.TrimSpace(path)
		if value == "" {
			continue
		}
		if strings.Contains(value, ",") {
			parts := strings.Split(value, ",")
			for _, part := range parts {
				trimmed := strings.TrimSpace(part)
				if trimmed != "" {
					normalized = append(normalized, trimmed)
				}
			}
			continue
		}
		normalized = append(normalized, value)
	}
	return normalized
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
