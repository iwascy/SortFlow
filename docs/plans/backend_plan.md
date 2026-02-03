# SortFlow 后端开发计划

## 概述

本文档描述后端开发的完整任务列表和技术要求。后端基于 Go 1.21+ + Gin 构建，使用 GORM + SQLite 进行数据持久化。

## 技术栈

- **语言**: Go 1.21+
- **Web框架**: Gin
- **数据验证**: go-playground/validator
- **ORM**: GORM
- **数据库**: SQLite
- **文件监控**: fsnotify (可选)
- **元数据提取**: goexif / imaging
- **配置管理**: viper
- **日志**: zap / zerolog

## 目录结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
├── internal/
│   ├── api/
│   │   ├── handler/
│   │   │   ├── system.go        # 系统配置Handler
│   │   │   ├── files.go         # 文件操作Handler
│   │   │   ├── preview.go       # 预览Handler
│   │   │   ├── organize.go      # 执行Handler
│   │   │   ├── tasks.go         # 任务进度Handler
│   │   │   └── history.go       # 历史记录Handler
│   │   ├── middleware/
│   │   │   ├── cors.go          # CORS中间件
│   │   │   ├── logger.go        # 日志中间件
│   │   │   └── recovery.go      # 错误恢复中间件
│   │   └── router.go            # 路由汇总
│   ├── config/
│   │   └── config.go            # 环境配置
│   ├── model/
│   │   ├── preset.go            # 预设模型
│   │   ├── target.go            # 目标根目录模型
│   │   ├── history.go           # 历史记录模型
│   │   └── task.go              # 任务模型
│   ├── dto/
│   │   ├── config.go            # 配置相关DTO
│   │   ├── file.go              # 文件相关DTO
│   │   ├── preview.go           # 预览相关DTO
│   │   ├── execute.go           # 执行相关DTO
│   │   └── history.go           # 历史相关DTO
│   ├── service/
│   │   ├── file_system.go       # 文件系统服务
│   │   ├── metadata.go          # 元数据提取服务
│   │   ├── preview_engine.go    # 预览计算引擎
│   │   ├── execution_engine.go  # 执行引擎
│   │   ├── config_service.go    # 配置管理服务
│   │   └── history_service.go   # 历史记录服务
│   └── pkg/
│       ├── security/
│       │   └── path.go          # 路径安全校验
│       └── thumbnail/
│           └── generator.go     # 缩略图生成
├── tests/                       # 单元测试
├── go.mod
├── go.sum
└── Dockerfile
```

## 任务跟踪

详细任务列表见 [backend_tasks.csv](./backend_tasks.csv)

---

## Phase 1: 基础框架搭建

### 1.1 Go 项目初始化

创建标准的 Go 项目结构。

**入口文件** (`cmd/server/main.go`):
```go
package main

import (
    "log"

    "github.com/gin-gonic/gin"
    "sortflow/internal/api"
    "sortflow/internal/config"
)

func main() {
    // 加载配置
    cfg := config.Load()

    // 初始化 Gin
    r := gin.Default()

    // 注册路由
    api.RegisterRoutes(r, cfg)

    // 启动服务
    log.Printf("Server starting on :%d", cfg.Port)
    if err := r.Run(cfg.ServerAddr()); err != nil {
        log.Fatal(err)
    }
}
```

### 1.2 SQLite 数据库配置

使用 GORM + SQLite 存储配置和历史记录。

**表结构**:
- `source_watchers` - 源目录列表
- `target_roots` - 目标根目录
- `presets` - 分类预设
- `histories` - 操作历史
- `history_files` - 历史文件详情
- `tasks` - 任务状态

**数据库初始化** (`internal/config/database.go`):
```go
package config

import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

func InitDB(dbPath string) (*gorm.DB, error) {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    // 自动迁移
    db.AutoMigrate(
        &model.SourceWatcher{},
        &model.TargetRoot{},
        &model.Preset{},
        &model.History{},
        &model.HistoryFile{},
        &model.Task{},
    )

    return db, nil
}
```

### 1.3 DTO 定义

定义所有请求/响应数据传输对象。

### 1.4 环境配置

使用 viper 管理配置。

**配置项**:
```go
type Config struct {
    Port             int      `mapstructure:"port"`
    DatabaseURL      string   `mapstructure:"database_url"`
    AllowedRootPaths []string `mapstructure:"allowed_root_paths"`
    ThumbnailSize    int      `mapstructure:"thumbnail_size"`
    ThumbnailFormat  string   `mapstructure:"thumbnail_format"`
}

func Load() *Config {
    viper.SetDefault("port", 8000)
    viper.SetDefault("database_url", "sortflow.db")
    viper.SetDefault("allowed_root_paths", []string{"/nas", "/mnt", "/Volumes"})
    viper.SetDefault("thumbnail_size", 400)
    viper.SetDefault("thumbnail_format", "webp")

    viper.AutomaticEnv()

    var cfg Config
    viper.Unmarshal(&cfg)
    return &cfg
}
```

---

## Phase 2: 核心功能实现

### 2.1 文件系统服务

**功能点**:
1. 目录扫描（支持递归）
2. 路径安全校验（防止路径遍历）
3. 文件元信息获取

**安全校验**:
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

### 2.2 缩略图服务

**功能点**:
1. 使用 imaging 库生成缩略图
2. 支持 WebP 格式输出
3. 缓存机制（基于文件修改时间）

### 2.3 元数据提取服务

**功能点**:
1. EXIF 信息提取（拍摄日期、相机、镜头等）
2. 文件基础信息（大小、创建时间、修改时间）

### 2.4 预览计算引擎 (核心)

**功能点**:
1. 根据规则构建新文件名
2. 批次内冲突检测
3. 磁盘冲突检测
4. 自动添加后缀解决冲突

**算法逻辑**:
```go
func (e *PreviewEngine) GeneratePreview(files []FileInfo, rules RenameRules, targetPath string) []PreviewResult {
    nameMap := make(map[string]int) // 记录当前批次内的命名
    results := make([]PreviewResult, 0, len(files))

    for _, file := range files {
        newName := e.buildName(file, rules)

        // 批次内冲突检测
        if count, exists := nameMap[newName]; exists {
            nameMap[newName] = count + 1
            newName = e.addSuffix(newName, count+1)
        } else {
            nameMap[newName] = 0
        }

        // 磁盘冲突检测
        fullPath := filepath.Join(targetPath, newName)
        var status, reason string

        if _, err := os.Stat(fullPath); err == nil {
            newName = e.findAvailableName(targetPath, newName)
            status = "auto_renamed"
            reason = "disk_conflict"
        } else {
            status = "ready"
            reason = ""
        }

        results = append(results, PreviewResult{
            FileID:       file.ID,
            NewName:      newName,
            Status:       status,
            StatusReason: reason,
        })
    }

    return results
}
```

### 2.5 执行引擎

**功能点**:
1. 文件移动/复制
2. 进度跟踪
3. 错误处理
4. 历史记录写入

**执行流程**:
```
接收请求 → 创建任务 → 返回taskId
    ↓
后台执行 (goroutine):
    遍历文件 → 移动/复制 → 更新进度 → 写入日志
    ↓
完成 → 写入历史记录 → 更新任务状态
```

**并发执行示例**:
```go
func (e *ExecutionEngine) Execute(taskID string, actions []OrganizeAction) {
    go func() {
        for i, action := range actions {
            if err := e.processFile(action); err != nil {
                e.logError(taskID, err)
            }
            e.updateProgress(taskID, float64(i+1)/float64(len(actions)))
        }
        e.completeTask(taskID)
    }()
}
```

### 2.6 任务管理

**功能点**:
1. 任务创建和状态管理
2. 进度查询接口
3. 日志记录

---

## Phase 3: 配置管理

### 3.1 源目录管理

**API**:
- `POST /system/watchers` - 添加源目录
- `DELETE /system/watchers?path=...` - 删除源目录

**验证规则**:
- 路径必须存在
- 路径必须是目录
- 路径必须在 ALLOWED_ROOT_PATHS 范围内

### 3.2 分类预设管理

**API**:
- `POST /system/presets` - 创建预设
- `PUT /system/presets/{id}` - 更新预设
- `DELETE /system/presets/{id}` - 删除预设
- `PUT /system/presets/reorder` - 重排序

### 3.3 目标根目录管理

**API**:
- `POST /system/targets` - 创建目标
- `PUT /system/targets/{id}` - 更新目标
- `DELETE /system/targets/{id}` - 删除目标

---

## Phase 4: 历史记录

### 4.1 历史记录存储

**数据结构**:
```go
type History struct {
    ID           string    `gorm:"primaryKey"`
    Timestamp    time.Time `gorm:"autoCreateTime"`
    Action       string    // move/copy
    FileCount    int
    PresetID     string
    TargetRootID string
    TargetPath   string
    Status       string    // completed/failed
    CanUndo      bool
    UndoExpiresAt time.Time
}

type HistoryFile struct {
    ID           uint   `gorm:"primaryKey;autoIncrement"`
    HistoryID    string `gorm:"index"`
    OriginalPath string
    OriginalName string
    NewPath      string
    NewName      string
    Status       string // success/failed
}
```

### 4.2 历史查询API

**功能点**:
1. 分页查询
2. 按操作类型筛选
3. 详情查询

### 4.3 撤销功能

**逻辑**:
1. 检查 can_undo 状态
2. 遍历 history_files，将文件移回原位置
3. 更新历史记录状态

**限制**:
- 仅限一定时间内的操作可撤销（如7天）
- 如果文件已被修改/删除，部分撤销

---

## Phase 5: 优化与完善

### 5.1 并发处理

- 使用 goroutine + channel 并发处理文件操作
- 使用 sync.WaitGroup 等待批量操作完成
- 使用 worker pool 模式控制并发数

### 5.2 错误处理

- 统一错误响应格式
- 使用 Gin 的 recovery 中间件
- 详细的错误日志 (zap/zerolog)

### 5.3 性能优化

- 缩略图缓存
- 数据库连接池 (GORM 默认支持)
- 文件操作批量处理

---

## API 接口清单

| 路径                      | 方法   | 说明           | 优先级 |
| ------------------------- | ------ | -------------- | ------ |
| `/system/config`          | GET    | 获取系统配置   | P0     |
| `/system/watchers`        | POST   | 添加源目录     | P1     |
| `/system/watchers`        | DELETE | 删除源目录     | P1     |
| `/system/presets`         | POST   | 创建预设       | P1     |
| `/system/presets/{id}`    | PUT    | 更新预设       | P1     |
| `/system/presets/{id}`    | DELETE | 删除预设       | P1     |
| `/system/presets/reorder` | PUT    | 预设排序       | P2     |
| `/system/targets`         | POST   | 创建目标根目录 | P1     |
| `/system/targets/{id}`    | PUT    | 更新目标根目录 | P1     |
| `/system/targets/{id}`    | DELETE | 删除目标根目录 | P1     |
| `/files/list`             | GET    | 获取文件列表   | P0     |
| `/files/thumbnail`        | GET    | 获取缩略图     | P0     |
| `/files/metadata`         | GET    | 获取文件元数据 | P2     |
| `/preview`                | POST   | 计算预览结果   | P0     |
| `/organize/execute`       | POST   | 执行操作       | P0     |
| `/tasks/{id}`             | GET    | 查询任务进度   | P0     |
| `/history`                | GET    | 历史列表       | P1     |
| `/history/{id}`           | GET    | 历史详情       | P2     |
| `/history/{id}/undo`      | POST   | 撤销操作       | P1     |
| `/history`                | DELETE | 清理历史       | P2     |

---

## 开发注意事项

1. **路径安全**: 所有路径操作必须经过安全校验，防止路径遍历攻击
2. **原子性**: 文件操作尽量保持原子性，失败时能回滚
3. **并发处理**: 耗时操作使用 goroutine 异步处理
4. **日志记录**: 关键操作记录详细日志 (推荐 zap)
5. **单元测试**: 核心逻辑编写单元测试，特别是冲突检测逻辑
6. **优雅关闭**: 实现 graceful shutdown，确保进行中的任务能正常完成
