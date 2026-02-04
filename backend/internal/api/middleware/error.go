package middleware

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"sortflow/internal/api/response"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 || c.Writer.Written() {
			return
		}

		lastErr := c.Errors.Last().Err
		var apiErr *response.APIError
		if errors.As(lastErr, &apiErr) {
			c.JSON(apiErr.Status, response.BuildResponse(apiErr))
			return
		}

		c.JSON(http.StatusInternalServerError, response.ErrorResponse{
			Code:    "internal_error",
			Message: "internal server error",
		})
	}
}
