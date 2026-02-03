package middleware

import "github.com/gin-gonic/gin"

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 || c.Writer.Written() {
			return
		}

		status := c.Writer.Status()
		if status < 400 {
			status = 500
		}

		c.JSON(status, gin.H{"error": c.Errors.String()})
	}
}
