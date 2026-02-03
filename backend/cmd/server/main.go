package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"sortflow/internal/api"
	"sortflow/internal/config"
)

func main() {
	cfg := config.Load()

	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	api.RegisterRoutes(r, cfg, db)

	log.Printf("Server starting on :%d", cfg.Port)
	if err := r.Run(cfg.ServerAddr()); err != nil {
		log.Fatal(err)
	}
}
