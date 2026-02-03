# SortFlow 后端技术方案

## 1. 概述
后端服务是 SortFlow 的核心引擎，负责直接与操作系统文件系统交互，执行实际的“搬运”工作。

鉴于需要高效处理文件 I/O 以及元数据提取，本方案选用 **Python** 作为开发语言。

## 2. 技术栈选型

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **语言** | **Python 3.10+** | 强大的标准库 (`pathlib`, `os`) 和 AI 生态。 |
| **Web 框架** | **FastAPI** | 高性能异步框架，自动生成 OpenAPI (Swagger) 文档，便于前端对接。 |
| **数据验证** | **Pydantic v2** | 严格的请求/响应模型定义。 |
| **文件监控** | **Watchdog** | (可选) 实时监控目录变化并推送到前端。 |
| **元数据提取** | **Pillow / python-exif** | 快速提取图片 Exif (拍摄日期) 用于重命名。 |
| **任务队列** | **BackgroundTasks (FastAPI原生)** | 处理耗时的文件移动操作，避免阻塞 API 响应。 |

## 3. 架构设计

### 3.1 模块划分

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/      # 路由定义 (files.py, organize.py)
│   │   └── deps.py         # 依赖注入
│   ├── core/
│   │   ├── config.py       # 环境变量配置
│   │   └── security.py     # (如有需要) 鉴权逻辑
│   ├── services/
│   │   ├── file_system.py  # 核心文件操作 (扫描, 移动, 重命名, 冲突检测)
│   │   └── metadata.py     # Exif/元数据解析器
│   ├── schemas/            # Pydantic 模型
│   └── main.py             # 启动入口
└── requirements.txt
```

### 3.2 核心业务逻辑

#### A. 文件扫描服务 (`FileSystemService`)
*   **安全沙箱**: 配置文件必须指定 `ALLOWED_ROOT_PATHS` (例如 `/nas/`, `/mnt/data/`)，后端严禁访问此范围之外的系统文件。
*   **缩略图生成**:
    *   对于图片/视频，后端实时或预生成缩略图。
    *   API: `GET /files/thumbnail?path=...`
    *   使用 `Pillow` 生成低分辨率 WebP 格式以节省带宽。

#### C. 配置持久化服务 (`ConfigService`)
*   **存储机制**: 使用 `SQLite` 或 `JSON` 文件 (`~/.sortflow/config.json`) 存储用户自定义的配置。
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
*   **回滚机制**: (高级特性) 记录操作日志，支持简单的“撤销”操作（将文件移回原路径）。

## 4. 数据模型 (Pydantic)

```python
class FileMetadata(BaseModel):
    name: str
    path: str
    size: int
    created_at: float
    mime_type: str

class OrganizeAction(BaseModel):
    original_path: str
    destination_path: str
    action: Literal["move", "copy"] = "move"
    on_conflict: Literal["skip", "rename", "overwrite"] = "rename"

class ExecutionResult(BaseModel):
    success: bool
    processed_count: int
    errors: List[str]
```

## 5. 安全性
1.  **路径遍历防御**: 严格校验所有传入的 `path` 参数，确保其解析后的绝对路径位于 `ALLOWED_ROOT_PATHS` 之下。

## 6. 部署
*   使用 `uvicorn` 作为 ASGI 服务器。
*   建议使用 Docker 容器化部署，挂载宿主机的 NAS 目录或存储目录到容器内部。

```dockerfile
# 示例
FROM python:3.10-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
