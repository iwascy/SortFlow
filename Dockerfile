# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /work/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_BASE_URL
ARG VITE_USE_MOCK=false
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_USE_MOCK=${VITE_USE_MOCK}
RUN npx vite build

FROM golang:1.22-bookworm AS backend-builder

RUN apt-get update && apt-get install -y --no-install-recommends build-essential ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /work/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/server ./cmd/server

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=backend-builder /out/server /app/server
COPY --from=frontend-builder /work/frontend/dist /app/web
RUN useradd -r -m -d /app appuser && mkdir -p /data && chown -R appuser:appuser /app /data
USER appuser

ENV PORT=8463
ENV DATABASE_URL=/data/sortflow.db
VOLUME ["/data"]

EXPOSE 8463
ENTRYPOINT ["/app/server"]
