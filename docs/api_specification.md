# SortFlow API 接口文档

## 1. 基础说明
*   **Base URL**: `http://localhost:8000/api/v1`
*   **协议**: HTTP/1.1
*   **数据格式**: JSON
*   **认证**: 无 (本地应用)
*   **错误处理**: 所有错误响应遵循标准格式：
    ```json
    {
      "detail": "Error message description",
      "code": "ERROR_CODE"
    }
    ```
*   **通用错误码**:
    | 状态码 | 说明 |
    |-------|------|
    | 400 | 请求参数错误 |
    | 404 | 资源不存在 |
    | 403 | 路径不在允许范围内 |
    | 500 | 服务器内部错误 |

## 2. 接口定义

### 2.1 系统配置 (System Config)

#### 获取系统配置与目录
*   **GET** `/system/config`
*   **Description**: 获取前端初始化所需的所有静态配置，包括允许扫描的源目录、目标存储根目录以及分类预设。
*   **Response**: `200 OK`
    ```json
    {
      "sourceWatchers": [
        "/nas/upload/raw",
        "/mnt/sdcard/dcim",
        "/mnt/download"
      ],
      "targetRoots": [
        { "id": "nas-photos", "name": "NAS Photos", "path": "/mnt/nas/photos/2024", "icon": "dns" },
        { "id": "cloud-backup", "name": "Cloud Backup", "path": "/cloud/backups/archive", "icon": "cloud_done" },
        { "id": "local-ssd", "name": "Local SSD", "path": "/Volumes/SSD_PRO/Work", "icon": "memory" }
      ],
      "presets": [
        { 
          "id": "vacation", 
          "name": "Vacation", 
          "icon": "beach_access", 
          "color": "primary", 
          "targetSubPath": "Vacation", 
          "defaultPrefix": "VAC_" 
        }
      ]
    }
    ```

#### 添加源目录 (Source Watcher)
*   **POST** `/system/watchers`
*   **Description**: 添加一个新的文件夹路径到监控列表。
*   **Request Body**:
    ```json
    {
      "path": "/Volumes/MyExternalDrive/Photos"
    }
    ```
*   **Response**: `200 OK` (返回更新后的配置或仅状态码)

#### 移除源目录
*   **DELETE** `/system/watchers`
*   **Query Params**:
    *   `path` (required): 要移除的路径。
*   **Response**: `204 No Content`

#### 创建分类预设 (Category Preset)
*   **POST** `/system/presets`
*   **Request Body**:
    ```json
    {
      "name": "Work Projects",
      "icon": "work",
      "color": "blue",
      "targetSubPath": "Work/Projects",
      "defaultPrefix": "PROJ_"
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "id": "generated_uuid",
      "name": "Work Projects",
      ...
    }
    ```

#### 更新分类预设
*   **PUT** `/system/presets/{id}`
*   **Request Body**: (Partial object allowed)
    ```json
    {
      "targetSubPath": "Work/Archived"
    }
    ```
*   **Response**: `200 OK`

#### 删除分类预设
*   **DELETE** `/system/presets/{id}`
*   **Response**: `204 No Content`

#### 重排分类预设顺序
*   **PUT** `/system/presets/reorder`
*   **Description**: 更新分类预设的显示顺序（用于拖拽排序后保存）。
*   **Request Body**:
    ```json
    {
      "orderedIds": ["vacation", "scenery", "kids", "receipts", "documents"]
    }
    ```
*   **Response**: `200 OK`

#### 创建目标根目录 (Target Root)
*   **POST** `/system/targets`
*   **Description**: 添加一个新的目标存储根目录。
*   **Request Body**:
    ```json
    {
      "name": "External SSD",
      "path": "/Volumes/MySSD/Archive",
      "icon": "hard_drive"
    }
    ```
*   **Response**: `201 Created`
    ```json
    {
      "id": "generated_uuid",
      "name": "External SSD",
      "path": "/Volumes/MySSD/Archive",
      "icon": "hard_drive"
    }
    ```

#### 更新目标根目录
*   **PUT** `/system/targets/{id}`
*   **Request Body**: (Partial object allowed)
    ```json
    {
      "name": "My External SSD",
      "path": "/Volumes/MySSD/Photos"
    }
    ```
*   **Response**: `200 OK`

#### 删除目标根目录
*   **DELETE** `/system/targets/{id}`
*   **Response**: `204 No Content`

### 2.2 文件系统 (File System)

#### 获取指定目录下的文件列表
*   **GET** `/files/list`
*   **Query Params**:
    *   `path` (required): 目标目录的绝对路径 (必须在 `sourceWatchers` 允许范围内)。
    *   `recursive` (optional): 是否递归扫描 (默认 `false`)。
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": "hash_or_path_base64",
        "name": "DSC001.jpg",
        "path": "/nas/upload/raw",
        "size": "2.4MB",
        "type": "JPG",
        "thumbnail": "/api/v1/files/thumbnail?path=...", 
        "lastModified": "2023-10-01T12:00:00Z"
      }
    ]
    ```

#### 获取文件缩略图
*   **GET** `/files/thumbnail`
*   **Query Params**:
    *   `path` (required): 图片文件的完整路径。
*   **Response**: `200 OK` (image/webp) 或 `404 Not Found` (返回默认占位图)。

#### 获取文件元数据
*   **GET** `/files/metadata`
*   **Description**: 获取单个文件的详细元数据，包括 EXIF 信息。
*   **Query Params**:
    *   `path` (required): 文件的完整路径。
*   **Response**: `200 OK`
    ```json
    {
      "path": "/nas/upload/raw/DSC001.jpg",
      "name": "DSC001.jpg",
      "size": 2516582,
      "sizeHuman": "2.4MB",
      "mimeType": "image/jpeg",
      "createdAt": "2024-01-15T10:30:00Z",
      "modifiedAt": "2024-01-15T10:30:00Z",
      "exif": {
        "dateTaken": "2024-01-15T08:23:45Z",
        "camera": "Sony A7IV",
        "lens": "24-70mm f/2.8",
        "dimensions": "6000x4000",
        "iso": 400,
        "aperture": "f/2.8",
        "shutterSpeed": "1/250"
      }
    }
    ```
*   **Error Response**: `404 Not Found` 文件不存在

### 2.3 预览引擎 (Preview / Dry Run)

#### 计算重命名预览 (核心接口)
*   **POST** `/preview`
*   **Description**: 根据当前选中文件和重命名规则，计算预期结果。前端每次改选项时防抖调用此接口，实现实时预览。
*   **Request Body**:
    ```json
    {
      "fileIds": ["1", "2", "3"],
      "targetRootId": "nas-photos",
      "presetId": "vacation",
      "rules": {
        "usePrefix": true,
        "useDate": true,
        "dateSource": "exif",
        "useOriginalName": false,
        "tokenMode": "selected",
        "selectedTokens": ["SHANGHAI", "2024"],
        "regexPattern": null,
        "customSuffix": null
      }
    }
    ```
*   **Request Fields**:
    | 字段 | 类型 | 必填 | 说明 |
    |-----|------|-----|------|
    | fileIds | string[] | 是 | 选中文件的ID列表 |
    | targetRootId | string | 是 | 目标根目录ID |
    | presetId | string | 是 | 分类预设ID |
    | rules.usePrefix | boolean | 是 | 是否使用分类前缀 |
    | rules.useDate | boolean | 是 | 是否包含日期 |
    | rules.dateSource | string | 否 | 日期来源: "exif" / "fileCreated" / "now"，默认 "exif" |
    | rules.useOriginalName | boolean | 是 | 是否保留原文件名 |
    | rules.tokenMode | string | 否 | 分词模式: "all" / "selected" / "regex"，默认 "all" |
    | rules.selectedTokens | string[] | 否 | 当 tokenMode="selected" 时，用户选中的分词 |
    | rules.regexPattern | string | 否 | 当 tokenMode="regex" 时的正则表达式 |
    | rules.customSuffix | string | 否 | 自定义后缀 |

*   **Response**: `200 OK`
    ```json
    {
      "status": "ok",
      "conflictsResolved": 2,
      "totalFiles": 3,
      "previews": [
        {
          "fileId": "1",
          "originalPath": "/nas/upload/raw/DSC001.jpg",
          "originalName": "DSC001.jpg",
          "targetPath": "/mnt/nas/photos/2024/Vacation/",
          "newName": "VAC_2024-01-15_001.jpg",
          "status": "ready",
          "statusReason": null
        },
        {
          "fileId": "2",
          "originalPath": "/nas/upload/raw/DSC002.ARW",
          "originalName": "DSC002.ARW",
          "targetPath": "/mnt/nas/photos/2024/Vacation/",
          "newName": "VAC_2024-01-15_001-01.ARW",
          "status": "auto_renamed",
          "statusReason": "batch_conflict"
        },
        {
          "fileId": "3",
          "originalPath": "/nas/upload/raw/DSC003.jpg",
          "originalName": "DSC003.jpg",
          "targetPath": "/mnt/nas/photos/2024/Vacation/",
          "newName": "VAC_2024-01-15_002.jpg",
          "status": "auto_renamed",
          "statusReason": "disk_conflict"
        }
      ],
      "errors": []
    }
    ```
*   **Preview Status Values**:
    | status | 说明 |
    |--------|------|
    | ready | 路径正常，无冲突 |
    | auto_renamed | 检测到冲突，已自动添加后缀 |
    | error | 目标目录不可写 / 磁盘已满等错误 |

*   **Status Reason Values**:
    | statusReason | 说明 |
    |--------------|------|
    | null | 无冲突 |
    | batch_conflict | 当前批次内文件名冲突 |
    | disk_conflict | 目标目录已存在同名文件 |
    | permission_denied | 目标目录无写入权限 |
    | disk_full | 磁盘空间不足 |

### 2.4 执行引擎 (Execution)

#### 提交批量操作任务
*   **POST** `/organize/execute`
*   **Description**: 接收前端计算好的 `Preview Operations` 并执行实际的文件移动/重命名。
*   **Request Body**:
    ```json
    {
      "operations": [
        {
          "id": "file_id_1",
          "originalPath": "/nas/upload/raw/DSC001.jpg",
          "destinationPath": "/mnt/nas/photos/2024/Vacation/", // 目标文件夹
          "newFilename": "VAC_2023-10-01_001.jpg", // 新文件名
          "action": "move" // move, copy
        }
      ],
      "options": {
        "onConflict": "rename" // skip, rename, overwrite
      }
    }
    ```
*   **Response**: `202 Accepted`
    ```json
    {
      "taskId": "task_12345_abcde",
      "status": "pending"
    }
    ```

#### 查询任务进度
*   **GET** `/tasks/{taskId}`
*   **Response**: `200 OK`
    ```json
    {
      "id": "task_12345_abcde",
      "status": "processing", // pending, processing, completed, failed
      "progress": 45, // 0-100
      "totalFiles": 100,
      "processedFiles": 45,
      "logs": [
        "Block 5 written to NAS Photos",
        "Moved DSC001.jpg to Vacation/VAC_...jpg"
      ]
    }
    ```

## 3. WebSocket (可选)
如果需要实时性更高的进度反馈，可使用 WebSocket。

*   **WS** `/ws/tasks/{taskId}`
*   **Server Messages**:
    ```json
    { "type": "progress", "value": 50 }
    { "type": "log", "message": "Processing file X..." }
    { "type": "complete", "result": { ... } }
    ```

## 4. 历史记录 (History)

### 4.1 获取操作历史列表
*   **GET** `/history`
*   **Description**: 获取文件操作历史记录，支持分页。
*   **Query Params**:
    *   `page` (optional): 页码，默认 1
    *   `limit` (optional): 每页条数，默认 20，最大 100
    *   `action` (optional): 筛选操作类型 "move" / "copy" / "all"
*   **Response**: `200 OK`
    ```json
    {
      "total": 156,
      "page": 1,
      "pageSize": 20,
      "totalPages": 8,
      "items": [
        {
          "id": "hist_001",
          "timestamp": "2024-01-15T14:30:00Z",
          "action": "move",
          "fileCount": 25,
          "preset": {
            "id": "vacation",
            "name": "Vacation"
          },
          "targetRoot": {
            "id": "nas-photos",
            "name": "NAS Photos"
          },
          "targetPath": "/mnt/nas/photos/2024/Vacation/",
          "status": "completed",
          "canUndo": true,
          "undoExpiresAt": "2024-01-22T14:30:00Z",
          "summary": "Moved 25 files to /mnt/nas/photos/2024/Vacation/"
        },
        {
          "id": "hist_002",
          "timestamp": "2024-01-14T10:15:00Z",
          "action": "move",
          "fileCount": 12,
          "preset": {
            "id": "receipts",
            "name": "Receipts"
          },
          "targetRoot": {
            "id": "cloud-backup",
            "name": "Cloud Backup"
          },
          "targetPath": "/cloud/backups/archive/Finance/Receipts/",
          "status": "completed",
          "canUndo": false,
          "undoExpiresAt": null,
          "summary": "Moved 12 files to /cloud/backups/archive/Finance/Receipts/"
        }
      ]
    }
    ```

### 4.2 获取历史记录详情
*   **GET** `/history/{historyId}`
*   **Description**: 获取单条历史记录的详细信息，包括所有涉及的文件。
*   **Response**: `200 OK`
    ```json
    {
      "id": "hist_001",
      "timestamp": "2024-01-15T14:30:00Z",
      "action": "move",
      "fileCount": 25,
      "preset": { "id": "vacation", "name": "Vacation" },
      "targetRoot": { "id": "nas-photos", "name": "NAS Photos" },
      "status": "completed",
      "canUndo": true,
      "files": [
        {
          "originalPath": "/nas/upload/raw/DSC001.jpg",
          "originalName": "DSC001.jpg",
          "newPath": "/mnt/nas/photos/2024/Vacation/VAC_2024-01-15_001.jpg",
          "newName": "VAC_2024-01-15_001.jpg",
          "status": "success"
        }
      ]
    }
    ```

### 4.3 撤销操作
*   **POST** `/history/{historyId}/undo`
*   **Description**: 撤销一次历史操作，将文件移回原始位置。仅限 `canUndo=true` 的记录。
*   **Response**: `202 Accepted`
    ```json
    {
      "taskId": "undo_task_12345",
      "status": "pending",
      "affectedFiles": 25
    }
    ```
*   **Error Responses**:
    *   `400 Bad Request`: 该操作不可撤销 (canUndo=false)
    *   `404 Not Found`: 历史记录不存在
    *   `409 Conflict`: 部分文件已被修改或删除，无法完全撤销

### 4.4 清理历史记录
*   **DELETE** `/history`
*   **Description**: 清理指定时间之前的历史记录。
*   **Query Params**:
    *   `before` (required): ISO 8601 时间戳，清理该时间之前的记录
*   **Response**: `200 OK`
    ```json
    {
      "deletedCount": 42
    }
    ```