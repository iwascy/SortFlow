# SortFlow 后端技术方案

## 1. 概述
后端服务是 SortFlow 的核心引擎，负责直接与操作系统文件系统交互，执行实际的"搬运"工作。

鉴于需要高效处理文件 I/O、高并发以及跨平台部署的需求，本方案选用 **Go** 作为开发语言。

## 2. 技术栈选型

| 模块           | 技术选型                    | 说明                                                |
| :------------- | :-------------------------- | :-------------------------------------------------- |
| **语言**       | **Go 1.21+**                | 原生支持高并发、编译为单一可执行文件、跨平台部署。  |
| **Web 框架**   | **Gin**                     | 高性能 HTTP 框架，轻量、社区活跃、中间件丰富。      |
| **数据验证**   | **go-playground/validator** | 结构体标签验证，与 Gin 无缝集成。                   |
| **ORM**        | **GORM**                    | Go 语言最流行的 ORM，支持 SQLite/MySQL/PostgreSQL。 |
| **数据库**     | **SQLite**                  | 轻量级嵌入式数据库，无需额外服务。                  |
| **文件监控**   | **fsnotify**                | (可选) 实时监控目录变化并推送到前端。               |
| **元数据提取** | **goexif / imaging**        | 快速提取图片 EXIF (拍摄日期) 用于重命名。           |
| **任务队列**   | **goroutine + channel**     | 原生并发处理耗时的文件移动操作。                    |
| **配置管理**   | **viper**                   | 支持多种配置格式 (YAML/JSON/ENV)。                  |

## 3. 架构设计

### 3.1 模块划分

```
backend/
├── cmd/
│   └── server/
│       └── main.go           # 启动入口
├── internal/
│   ├── api/
│   │   ├── handler/          # 路由处理器 (files.go, organize.go, system.go)
│   │   ├── middleware/       # 中间件 (cors.go, logger.go)
│   │   └── router.go         # 路由注册
│   ├── config/
│   │   └── config.go         # 配置加载
│   ├── model/                # 数据库模型 (GORM)
│   │   ├── preset.go
│   │   ├── target.go
│   │   ├── history.go
│   │   └── task.go
│   ├── dto/                  # 请求/响应数据传输对象
│   │   ├── file.go
│   │   ├── preview.go
│   │   └── execute.go
│   ├── service/
│   │   ├── file_system.go    # 核心文件操作 (扫描, 移动, 重命名, 冲突检测)
│   │   ├── metadata.go       # EXIF/元数据解析器
│   │   ├── preview_engine.go # 预览计算引擎
│   │   ├── execution_engine.go # 执行引擎
│   │   ├── config_service.go # 配置管理服务
│   │   └── history_service.go # 历史记录服务
│   └── pkg/
│       ├── security/         # 路径安全校验
│       └── thumbnail/        # 缩略图生成
├── go.mod
├── go.sum
└── Dockerfile
```

### 3.2 核心业务逻辑

#### A. 文件扫描服务 (`FileSystemService`)
*   **安全沙箱**: 配置文件必须指定 `ALLOWED_ROOT_PATHS` (例如 `/nas/`, `/mnt/data/`)，后端严禁访问此范围之外的系统文件。
*   **缩略图生成**:
    *   对于图片/视频，后端实时或预生成缩略图。
    *   API: `GET /files/thumbnail?path=...`
    *   使用 `imaging` 库生成低分辨率 WebP 格式以节省带宽。

#### C. 配置持久化服务 (`ConfigService`)
*   **存储机制**: 使用 `SQLite` (通过 GORM) 或 `JSON` 文件 (`~/.sortflow/config.json`) 存储用户自定义的配置。
*   **管理内容**:
    *   `source_watchers`: 用户添加的源目录列表（需校验路径有效性）。
    *   `presets`: 用户自定义的分类预设（JSON 数组）。
    *   `target_roots`: 目标存储根目录列表。
*   **初始化**: 服务启动时加载配置文件，如果不存在则写入默认配置。

#### D. 执行引擎 (`ExecutionEngine`)
*   **原子性**: 文件操作应尽可能保持原子性。
*   **冲突解决策略**:
    *   `skip`: 跳过同名文件。
    *   `overwrite`: 覆盖。
    *   `rename`: 自动添加后缀 `(1)`, `_copy`。
*   **回滚机制**: (高级特性) 记录操作日志，支持简单的"撤销"操作（将文件移回原路径）。

## 4. 数据模型 (Go Struct)

```go
type FileMetadata struct {
    Name      string  `json:"name"`
    Path      string  `json:"path"`
    Size      int64   `json:"size"`
    CreatedAt float64 `json:"created_at"`
    MimeType  string  `json:"mime_type"`
}

type OrganizeAction struct {
    OriginalPath    string `json:"original_path" binding:"required"`
    DestinationPath string `json:"destination_path" binding:"required"`
    Action          string `json:"action" binding:"oneof=move copy"`       // 默认 move
    OnConflict      string `json:"on_conflict" binding:"oneof=skip rename overwrite"` // 默认 rename
}

type ExecutionResult struct {
    Success        bool     `json:"success"`
    ProcessedCount int      `json:"processed_count"`
    Errors         []string `json:"errors"`
}
```

## 5. 安全性
1.  **路径遍历防御**: 严格校验所有传入的 `path` 参数，确保其解析后的绝对路径位于 `ALLOWED_ROOT_PATHS` 之下。

```go
func ValidatePath(path string, allowedRoots []string) bool {
    absPath, err := filepath.Abs(path)
    if err != nil {
        return false
    }
    cleanPath := filepath.Clean(absPath)
    for _, root := range allowedRoots {
        if strings.HasPrefix(cleanPath, root) {
            return true
        }
    }
    return false
}
```

## 6. 部署
*   Go 编译为单一可执行文件，无需额外运行时依赖。
*   建议使用 Docker 容器化部署，挂载宿主机的 NAS 目录或存储目录到容器内部。

```dockerfile
# 多阶段构建
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o sortflow ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates sqlite
WORKDIR /app
COPY --from=builder /app/sortflow .
EXPOSE 8000
CMD ["./sortflow"]
```
