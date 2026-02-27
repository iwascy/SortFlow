# SortFlow

> 中文 / English README for a production-style open-source project.

SortFlow 是一个面向照片、视频与文档的可视化整理工作台，支持批量预览重命名、冲突检测、任务执行与历史记录管理。  
SortFlow is a visual file-organizing workbench for photos, videos, and documents, featuring batch rename preview, conflict detection, execution tracking, and history management.

## 功能特性 | Features

- **实时预览（Dry Run）**：执行前先计算目标路径与新文件名。  
  **Live Dry Run**: Preview target paths and filenames before execution.
- **批量重命名与归档**：支持前缀、日期、原名等规则组合。  
  **Batch Rename & Routing**: Combine prefix/date/original-name strategies.
- **重复冲突检测**：执行前检查同名目标并支持跳过/覆盖确认。  
  **Duplicate Conflict Check**: Detect target collisions before commit.
- **任务进度追踪**：通过任务接口与 WebSocket 查看执行状态。  
  **Task Progress Tracking**: Monitor jobs via task API and WebSocket.
- **配置中心**：管理源目录（watchers）、目标目录（targets）、分类预设（presets）与关键词。  
  **Configuration Center**: Manage watchers, targets, presets, and keywords.
- **历史记录与撤销**：查看历史操作并执行撤销。  
  **History & Undo**: Review previous operations and undo when applicable.

## 技术栈 | Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Zustand + TanStack Query + Tailwind CSS
- **Backend**: Go 1.21+ + Gin + GORM + SQLite
- **Media**: EXIF extraction + WebP thumbnail generation (image/video)
- **Deployment**: Single container image (frontend + backend)

## 快速开始 | Quick Start

### 1) 前置条件 | Prerequisites

- Go 1.21+
- Node.js 20+
- npm 10+
- (可选/Optional) Docker

### 2) 本地开发 | Local Development

**启动后端 | Start backend**

```bash
cd backend
go mod download
go run ./cmd/server
```

默认监听 `http://localhost:8463`。  
Default server address: `http://localhost:8463`.

**启动前端 | Start frontend**

```bash
cd frontend
npm ci
npm run dev
```

默认前端地址 `http://localhost:5173`。  
Default frontend address: `http://localhost:5173`.

前端通过 `frontend/.env` 连接后端：  
Frontend connects to backend via `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8463
VITE_USE_MOCK=false
```

### 3) Docker 运行 | Run with Docker

```bash
docker build -t sortflow:all-in-one .
docker run -d --name sortflow \
  -p 8463:8463 \
  -e PORT=8463 \
  -e DATABASE_URL=/data/sortflow.db \
  -e ALLOWED_ROOT_PATHS=/data,/media/source,/media/target \
  -v $(pwd)/sortflow-data:/data \
  -v /path/to/source:/media/source:rw \
  -v /path/to/target:/media/target:rw \
  sortflow:all-in-one
```

> NAS 可参考 `docker-compose.nas.yml`。  
> For NAS deployment, see `docker-compose.nas.yml`.

## 环境变量 | Environment Variables

### Backend

- `PORT` (default: `8463`)
- `DATABASE_URL` (default: `sortflow.db`)
- `ALLOWED_ROOT_PATHS` (default: `/nas,/mnt,/Volumes,/Users`)
- `THUMBNAIL_SIZE` (default: `400`)
- `THUMBNAIL_FORMAT` (default: `webp`)

### Frontend

- `VITE_API_BASE_URL` (e.g. `http://localhost:8463`)
- `VITE_USE_MOCK` (`true` or `false`)

## API 概览 | API Overview

- `GET /files/list` / `GET /files/thumbnail` / `GET /files/metadata`
- `POST /preview`
- `POST /organize/duplicates` / `POST /organize/execute`
- `GET /tasks/:id` / `GET /ws/tasks/:id` / `POST /tasks/:id/cancel`
- `GET /system/config` + presets/targets/watchers/keywords CRUD
- `GET /history` / `GET /history/:id` / `POST /history/:id/undo`

详细文档见：`docs/api_specification.md`。  
For details, see: `docs/api_specification.md`.

## 测试 | Testing

```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npm run test -- --run
```

## 目录结构 | Project Structure

```text
SortFlow/
├─ backend/         # Go API + execution engine + SQLite models
├─ frontend/        # React application
├─ docs/            # product/API/design/review docs
├─ Dockerfile       # all-in-one image build
└─ docker-compose.nas.yml
```

## 贡献 | Contributing

欢迎提交 Issue 与 PR。  
Issues and pull requests are welcome.

建议流程 / Suggested flow:
1. Fork 仓库并创建特性分支 / Fork and create a feature branch
2. 提交变更并补充测试 / Commit changes with tests
3. 提交 PR 并描述动机与影响 / Open a PR with clear context

## 许可证 | License

当前仓库**尚未声明 LICENSE 文件**。  
This repository currently has **no declared LICENSE file**.

在许可证补充前，请勿将代码用于有法律要求的分发场景。  
Please avoid legal-sensitive redistribution until a license is added.
