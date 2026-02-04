package middleware

import (
	"errors"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"sortflow/internal/api/response"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)

		status := c.Writer.Status()
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", status),
			zap.Duration("latency", latency),
			zap.String("clientIP", c.ClientIP()),
		}

		if len(c.Errors) > 0 {
			lastErr := c.Errors.Last().Err
			var apiErr *response.APIError
			if errors.As(lastErr, &apiErr) {
				fields = append(fields, zap.String("errorCode", apiErr.Code))
			}
			fields = append(fields, zap.Error(lastErr))
			zap.L().Error("request failed", fields...)
			return
		}

		zap.L().Info("request completed", fields...)
	}
}
