# SortFlow 后端开发计划

## 概述

本文档描述后端开发的完整任务列表和技术要求。后端基于 Python 3.10+ + FastAPI 构建，使用 SQLite 进行数据持久化。

## 技术栈

- **语言**: Python 3.10+
- **Web框架**: FastAPI
- **数据验证**: Pydantic v2
- **数据库**: SQLite
- **文件监控**: Watchdog (可选)
- **元数据提取**: Pillow / python-exif
- **任务队列**: FastAPI BackgroundTasks
- **ASGI服务器**: Uvicorn

## 目录结构

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── system.py      # 系统配置API
│   │   │   ├── files.py       # 文件操作API
│   │   │   ├── preview.py     # 预览API
│   │   │   ├── organize.py    # 执行API
│   │   │   ├── tasks.py       # 任务进度API
│   │   │   └── history.py     # 历史记录API
│   │   ├── deps.py            # 依赖注入
│   │   └── router.py          # 路由汇总
│   ├── core/
│   │   ├── config.py          # 环境配置
│   │   ├── database.py        # 数据库连接
│   │   └── security.py        # 安全校验
│   ├── models/
│   │   ├── preset.py          # 预设模型
│   │   ├── target.py          # 目标根目录模型
│   │   ├── history.py         # 历史记录模型
│   │   └── task.py            # 任务模型
│   ├── schemas/
│   │   ├── config.py          # 配置相关Schema
│   │   ├── file.py            # 文件相关Schema
│   │   ├── preview.py         # 预览相关Schema
│   │   ├── execute.py         # 执行相关Schema
│   │   └── history.py         # 历史相关Schema
│   ├── services/
│   │   ├── file_system.py     # 文件系统服务
│   │   ├── metadata.py        # 元数据提取服务
│   │   ├── preview_engine.py  # 预览计算引擎
│   │   ├── execution_engine.py # 执行引擎
│   │   ├── config_service.py  # 配置管理服务
│   │   └── history_service.py # 历史记录服务
│   └── main.py                # 应用入口
├── tests/                     # 单元测试
├── requirements.txt
└── Dockerfile
```

## 任务跟踪

详细任务列表见 [backend_tasks.csv](./backend_tasks.csv)

---

## Phase 1: 基础框架搭建

### 1.1 FastAPI 项目初始化

创建标准的 FastAPI 项目结构。

**入口文件** (`main.py`):
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router

app = FastAPI(title="SortFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
```

### 1.2 SQLite 数据库配置

使用 SQLite 存储配置和历史记录。

**表结构**:
- `source_watchers` - 源目录列表
- `target_roots` - 目标根目录
- `presets` - 分类预设
- `history` - 操作历史
- `history_files` - 历史文件详情
- `tasks` - 任务状态

### 1.3 Pydantic Schema 定义

定义所有请求/响应模型。

### 1.4 环境配置

使用 pydantic-settings 管理配置。

**配置项**:
```python
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sortflow.db"
    ALLOWED_ROOT_PATHS: list[str] = ["/nas", "/mnt", "/Volumes"]
    THUMBNAIL_SIZE: tuple[int, int] = (400, 400)
    THUMBNAIL_FORMAT: str = "webp"
```

---

## Phase 2: 核心功能实现

### 2.1 文件系统服务

**功能点**:
1. 目录扫描（支持递归）
2. 路径安全校验（防止路径遍历）
3. 文件元信息获取

**安全校验**:
```python
def validate_path(path: str) -> bool:
    """确保路径在允许范围内"""
    resolved = Path(path).resolve()
    return any(
        str(resolved).startswith(allowed)
        for allowed in settings.ALLOWED_ROOT_PATHS
    )
```

### 2.2 缩略图服务

**功能点**:
1. 使用 Pillow 生成缩略图
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
```python
def generate_preview(files: list, rules: RenameRules, target_path: str) -> list:
    name_map = {}  # 记录当前批次内的命名
    results = []

    for file in files:
        new_name = build_name(file, rules)

        # 批次内冲突检测
        if new_name in name_map:
            name_map[new_name] += 1
            new_name = add_suffix(new_name, name_map[new_name])
        else:
            name_map[new_name] = 0

        # 磁盘冲突检测
        full_path = target_path + new_name
        if os.path.exists(full_path):
            new_name = find_available_name(target_path, new_name)
            status = "auto_renamed"
            reason = "disk_conflict"
        else:
            status = "ready"
            reason = None

        results.append({
            "fileId": file.id,
            "newName": new_name,
            "status": status,
            "statusReason": reason
        })

    return results
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
后台执行:
    遍历文件 → 移动/复制 → 更新进度 → 写入日志
    ↓
完成 → 写入历史记录 → 更新任务状态
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
```python
class History(Base):
    id: str
    timestamp: datetime
    action: str  # move/copy
    file_count: int
    preset_id: str
    target_root_id: str
    target_path: str
    status: str  # completed/failed
    can_undo: bool
    undo_expires_at: datetime

class HistoryFile(Base):
    history_id: str
    original_path: str
    original_name: str
    new_path: str
    new_name: str
    status: str  # success/failed
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

- 使用 asyncio 异步处理文件操作
- 大文件操作使用线程池

### 5.2 错误处理

- 统一错误响应格式
- 详细的错误日志

### 5.3 性能优化

- 缩略图缓存
- 数据库连接池
- 文件操作批量处理

---

## API 接口清单

| 路径 | 方法 | 说明 | 优先级 |
|-----|------|------|-------|
| `/system/config` | GET | 获取系统配置 | P0 |
| `/system/watchers` | POST | 添加源目录 | P1 |
| `/system/watchers` | DELETE | 删除源目录 | P1 |
| `/system/presets` | POST | 创建预设 | P1 |
| `/system/presets/{id}` | PUT | 更新预设 | P1 |
| `/system/presets/{id}` | DELETE | 删除预设 | P1 |
| `/system/presets/reorder` | PUT | 预设排序 | P2 |
| `/system/targets` | POST | 创建目标根目录 | P1 |
| `/system/targets/{id}` | PUT | 更新目标根目录 | P1 |
| `/system/targets/{id}` | DELETE | 删除目标根目录 | P1 |
| `/files/list` | GET | 获取文件列表 | P0 |
| `/files/thumbnail` | GET | 获取缩略图 | P0 |
| `/files/metadata` | GET | 获取文件元数据 | P2 |
| `/preview` | POST | 计算预览结果 | P0 |
| `/organize/execute` | POST | 执行操作 | P0 |
| `/tasks/{id}` | GET | 查询任务进度 | P0 |
| `/history` | GET | 历史列表 | P1 |
| `/history/{id}` | GET | 历史详情 | P2 |
| `/history/{id}/undo` | POST | 撤销操作 | P1 |
| `/history` | DELETE | 清理历史 | P2 |

---

## 开发注意事项

1. **路径安全**: 所有路径操作必须经过安全校验，防止路径遍历攻击
2. **原子性**: 文件操作尽量保持原子性，失败时能回滚
3. **异步处理**: 耗时操作使用 BackgroundTasks 或线程池
4. **日志记录**: 关键操作记录详细日志
5. **单元测试**: 核心逻辑编写单元测试，特别是冲突检测逻辑
