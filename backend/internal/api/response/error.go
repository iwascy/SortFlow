package response

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type APIError struct {
	Status  int
	Code    string
	Message string
	Details any
	Err     error
}

func (e *APIError) Error() string {
	if e.Err == nil {
		return fmt.Sprintf("%s: %s", e.Code, e.Message)
	}
	return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
}

func (e *APIError) Unwrap() error {
	return e.Err
}

func AbortWithError(c *gin.Context, err *APIError) {
	_ = c.Error(err)
	c.Abort()
}

func BuildResponse(err *APIError) ErrorResponse {
	if err == nil {
		return ErrorResponse{
			Code:    "internal_error",
			Message: "internal server error",
		}
	}
	return ErrorResponse{
		Code:    err.Code,
		Message: err.Message,
		Details: err.Details,
	}
}

func BadRequest(err error) *APIError {
	return &APIError{
		Status:  http.StatusBadRequest,
		Code:    "bad_request",
		Message: err.Error(),
		Err:     err,
	}
}

func NotFound(message string) *APIError {
	return &APIError{
		Status:  http.StatusNotFound,
		Code:    "not_found",
		Message: message,
	}
}

func Forbidden(message string) *APIError {
	return &APIError{
		Status:  http.StatusForbidden,
		Code:    "forbidden",
		Message: message,
	}
}

func Internal(err error) *APIError {
	message := "internal server error"
	if err == nil {
		err = errors.New(message)
	}
	return &APIError{
		Status:  http.StatusInternalServerError,
		Code:    "internal_error",
		Message: message,
		Err:     err,
	}
}
