FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:3.19
RUN adduser -D -g '' appuser
WORKDIR /app
COPY --from=builder /app/server /app/server
USER appuser
EXPOSE 8000
ENTRYPOINT ["/app/server"]
