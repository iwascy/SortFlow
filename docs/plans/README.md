# SortFlow 开发计划总览

## 项目背景

SortFlow 是一个文件整理工作台应用，帮助用户高效地对大量非结构化文件（如照片、文档）进行重命名和归档。

### 核心特性

1. **实时预览 (Dry Run)** - 任何参数修改都不会改变文件，而是实时计算并更新"预期结果"视图
2. **模式混音器 (Pattern Mixer)** - 可视化的重命名规则配置器，支持前缀、日期、分词选择等
3. **冲突检测** - 自动检测批次内冲突和磁盘冲突，并添加后缀解决
4. **历史记录与撤销** - 支持查看操作历史并撤销

### 技术架构

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS + Zustand
- **后端**: Python 3.10+ + FastAPI + SQLite
- **通信**: RESTful API + WebSocket (可选)

## 文档索引

| 文档 | 说明 |
|-----|------|
| [产品设计](../../产品设计.md) | 产品功能设计和交互说明 |
| [API规范](../api_specification.md) | 后端API接口定义 |
| [前端技术方案](../frontend_technical_design.md) | 前端架构和交互逻辑 |
| [后端技术方案](../backend_technical_design.md) | 后端架构和业务逻辑 |

## 开发计划

### 前端开发

详见 [frontend_plan.md](./frontend_plan.md) 和 [frontend_tasks.csv](./frontend_tasks.csv)

### 后端开发

详见 [backend_plan.md](./backend_plan.md) 和 [backend_tasks.csv](./backend_tasks.csv)

## 开发阶段

| 阶段 | 内容 | 前端 | 后端 |
|-----|------|-----|-----|
| Phase 1 | 基础框架搭建 | 项目结构、Store、API客户端 | FastAPI框架、SQLite、基础路由 |
| Phase 2 | 核心功能 | 文件浏览、Pattern Mixer、预览 | 文件扫描、预览计算、执行引擎 |
| Phase 3 | 配置管理 | 源目录/预设/目标CRUD | 配置持久化API |
| Phase 4 | 历史与撤销 | 历史列表、撤销功能 | 历史记录存储、撤销逻辑 |
| Phase 5 | 优化与完善 | 性能优化、错误处理 | 并发处理、日志完善 |

## 如何使用此计划

### 对于前端AI

1. 阅读 `frontend_plan.md` 了解前端整体任务
2. 查看 `frontend_tasks.csv` 获取具体任务列表
3. 按优先级(P0 > P1 > P2)和依赖关系完成任务
4. 完成后更新CSV中的状态

### 对于后端AI

1. 阅读 `backend_plan.md` 了解后端整体任务
2. 查看 `backend_tasks.csv` 获取具体任务列表
3. 按优先级和依赖关系完成任务
4. 完成后更新CSV中的状态

## CSV字段说明

| 字段 | 说明 |
|-----|------|
| id | 任务唯一标识 |
| phase | 所属开发阶段 |
| priority | 优先级 P0/P1/P2 |
| task | 任务名称 |
| description | 任务详细描述 |
| depends_on | 依赖的任务ID(逗号分隔) |
| status | 状态: todo/in_progress/done |
| reviewed | 是否已review: yes/no |
| notes | 备注 |
