package config

import (
	"fmt"

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
	viper.SetDefault("port", 8000)
	viper.SetDefault("database_url", "sortflow.db")
	viper.SetDefault("allowed_root_paths", []string{"/nas", "/mnt", "/Volumes"})
	viper.SetDefault("thumbnail_size", 400)
	viper.SetDefault("thumbnail_format", "webp")

	viper.AutomaticEnv()

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return &Config{
			Port:             8000,
			DatabaseURL:      "sortflow.db",
			AllowedRootPaths: []string{"/nas", "/mnt", "/Volumes"},
			ThumbnailSize:    400,
			ThumbnailFormat:  "webp",
		}
	}
	return &cfg
}

func (c *Config) ServerAddr() string {
	return fmt.Sprintf(":%d", c.Port)
}
