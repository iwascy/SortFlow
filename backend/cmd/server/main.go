package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"sortflow/internal/api"
	"sortflow/internal/api/middleware"
	"sortflow/internal/config"
)

func main() {
	cfg := config.Load()

	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}

	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal(err)
	}
	defer logger.Sync()
	zap.ReplaceGlobals(logger)

	r := gin.New()
	r.Use(middleware.Logger(), middleware.ErrorHandler(), middleware.CORS(), gin.Recovery())

	api.RegisterRoutes(r, cfg, db)

	server := &http.Server{
		Addr:    cfg.ServerAddr(),
		Handler: r,
	}

	go func() {
		log.Printf("Server starting on :%d", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("server shutdown: %v", err)
	}
}
