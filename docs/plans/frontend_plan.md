# SortFlow 前端开发计划

## 概述

本文档描述前端开发的完整任务列表和技术要求。前端基于 React 19 + TypeScript + Vite 构建，使用 Zustand 进行状态管理，TanStack Query 处理服务端状态。

## 技术栈

- **框架**: React 19
- **构建工具**: Vite
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **数据请求**: TanStack Query (React Query)
- **图标**: Material Symbols
- **路由**: React Router v6
- **拖拽**: @dnd-kit/core
- **框选**: react-selecto

## 目录结构

```
src/
├── components/              # 通用原子组件
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── ConfirmDialog.tsx
│   ├── IconPicker.tsx
│   ├── ColorPicker.tsx
│   └── StatusIndicator.tsx
├── features/               # 业务功能模块
│   ├── file-explorer/      # 文件浏览
│   ├── pattern-mixer/      # 重命名规则配置
│   ├── config/             # 配置管理
│   ├── execution/          # 任务执行
│   ├── history/            # 历史记录
│   └── dashboard/          # 页面布局
├── hooks/                  # 通用 Hooks
├── services/               # API 客户端
├── store/                  # Zustand Store
├── types/                  # 类型定义
└── utils/                  # 工具函数
```

## 任务跟踪

详细任务列表见 [frontend_tasks.csv](./frontend_tasks.csv)

---

## Phase 1: 基础框架搭建

### 1.1 项目结构重构

将现有 demo 代码重构为规范的目录结构。

**涉及文件**:
- 创建 `src/` 目录结构
- 迁移现有组件到对应目录

### 1.2 Zustand Store 实现

实现完整的全局状态管理。

**Store 结构**:
```typescript
interface AppStore {
  // 系统配置
  sourceWatchers: string[];
  targetRoots: TargetRoot[];
  presets: CategoryPreset[];

  // 文件浏览
  files: FileItem[];
  currentPath: string;
  isLoadingFiles: boolean;

  // 选择状态
  selectedIds: Set<string>;
  lastSelectedId: string | null;

  // Mixer配置
  mixerConfig: MixerConfig;

  // 预览结果
  previewOps: PreviewOperation[];
  isPreviewLoading: boolean;

  // 执行状态
  executionState: ExecutionState;
  currentTaskId: string | null;
  executionProgress: number;
  executionLogs: string[];
}
```

### 1.3 API 客户端封装

创建统一的 API 调用层。

**服务模块**:
- `api.ts` - 基础请求封装
- `configService.ts` - 配置相关API
- `fileService.ts` - 文件相关API
- `previewService.ts` - 预览API
- `executeService.ts` - 执行API
- `historyService.ts` - 历史API

### 1.4 通用组件库

实现基础UI组件。

**组件列表**:
- `Button` - 统一按钮样式
- `Modal` - 模态框基础组件
- `ConfirmDialog` - 确认对话框

---

## Phase 2: 核心功能实现

### 2.1 文件浏览模块

**功能点**:
1. 文件网格展示（支持虚拟滚动）
2. 缩略图懒加载
3. 多选交互（单击/Ctrl+点击/Shift连选）
4. 框选功能
5. 快捷键支持（Ctrl+A全选、Esc取消）

**选择交互逻辑**:
| 操作 | 行为 |
|-----|------|
| 单击 | 清除其他，选中当前 |
| Ctrl/Cmd + 点击 | 切换选中状态 |
| Shift + 点击 | 从上次选中位置连续选择 |
| 框选拖拽 | 选中区域内所有文件 |
| Ctrl/Cmd + A | 全选当前目录 |
| Esc | 清除所有选择 |

### 2.2 Pattern Mixer 模块

**功能点**:
1. 分类预设选择
2. 目标根目录选择
3. 重命名开关（PREFIX/DATE/RAW_NAME）
4. 日期来源选择（EXIF/文件创建/当前）
5. 分词选择器（Token Selector）
6. 高级规则面板（正则提取等）

**分词算法** (`utils/tokenizer.ts`):
1. 分隔符拆分: `/[_\-. \s]+/`
2. 驼峰拆分: `/(?=[A-Z])/`
3. 数字分离: 字母数字分开
4. 去噪: 过滤无意义字符
5. 去重

### 2.3 实时预览模块

**功能点**:
1. 调用 `/api/v1/preview` 获取预览结果
2. 300ms 防抖避免频繁请求
3. 状态指示灯显示（ready/auto_renamed/error）
4. 预览列表展示（最多显示5条+剩余数量）

**StatusIndicator 组件**:
```typescript
const STATUS_CONFIG = {
  ready: { color: 'emerald', icon: 'check_circle', label: 'OK' },
  auto_renamed: { color: 'amber', icon: 'warning', label: 'Renamed' },
  error: { color: 'red', icon: 'error', label: 'Error' }
};
```

### 2.4 执行模块

**状态机**:
```
IDLE → CONFIRMING → EXECUTING → DONE/ERROR → IDLE
```

**功能点**:
1. 确认对话框（显示文件数、目标路径、冲突数）
2. 进度轮询（500ms间隔）
3. 日志显示
4. 完成/错误状态展示

---

## Phase 3: 配置管理

### 3.1 源目录管理

**交互流程**:
```
点击"+"按钮 → 显示模态框 → 输入路径 → 验证 → 调用API → 更新列表
```

**验证规则**:
- 路径不能为空
- 必须是绝对路径（以 `/` 开头）
- 不能包含 `..`

### 3.2 分类预设管理

**功能点**:
1. 预设列表展示
2. 添加预设模态框
3. 编辑预设模态框
4. 删除确认
5. 拖拽排序

**预设表单字段**:
- name: 名称（1-20字符）
- icon: 图标（从选择器选择）
- color: 颜色
- targetSubPath: 目标子路径
- defaultPrefix: 默认前缀

### 3.3 目标根目录管理

**功能点**:
1. 目标列表展示
2. 添加/编辑/删除

### 3.4 图标与颜色选择器

**可用图标**:
```
landscape, beach_access, child_care, receipt, article,
photo_camera, videocam, work, home, favorite,
star, flight, restaurant, sports, music_note
```

**可用颜色**:
```
primary(cyan), indigo, amber, emerald, rose, violet
```

---

## Phase 4: 历史记录

### 4.1 历史列表页面

**功能点**:
1. 分页/无限滚动加载
2. 显示操作摘要、时间、文件数
3. 可撤销状态标识
4. 撤销按钮

### 4.2 历史详情

**功能点**:
1. 显示完整文件列表
2. 原路径 → 新路径映射

### 4.3 撤销功能

**交互流程**:
```
点击撤销 → 确认对话框 → 调用API → 显示进度 → 完成
```

---

## Phase 5: 优化与完善

### 5.1 性能优化

- 虚拟滚动（文件超过100个时启用）
- 缩略图懒加载
- 预览计算 Memoization
- Web Worker 处理分词（大量文件时）

### 5.2 错误处理

- API 错误统一处理
- 网络错误重试
- 用户友好的错误提示

### 5.3 UI/UX 完善

- 加载状态动画
- 空状态提示
- 响应式布局优化

---

## API 依赖

前端需要后端提供以下API：

| API | 方法 | 说明 | 优先级 |
|-----|------|------|-------|
| `/system/config` | GET | 获取系统配置 | P0 |
| `/files/list` | GET | 获取文件列表 | P0 |
| `/files/thumbnail` | GET | 获取缩略图 | P0 |
| `/preview` | POST | 计算预览结果 | P0 |
| `/organize/execute` | POST | 执行操作 | P0 |
| `/tasks/{id}` | GET | 查询任务进度 | P0 |
| `/system/watchers` | POST/DELETE | 源目录管理 | P1 |
| `/system/presets` | CRUD | 预设管理 | P1 |
| `/system/targets` | CRUD | 目标根目录管理 | P1 |
| `/history` | GET | 历史列表 | P1 |
| `/history/{id}/undo` | POST | 撤销操作 | P1 |
| `/files/metadata` | GET | 文件元数据 | P2 |

---

## 开发注意事项

1. **类型安全**: 所有API响应都要定义TypeScript类型
2. **乐观更新**: 配置修改时先更新UI再调用API
3. **错误回滚**: API失败时回滚乐观更新
4. **防抖节流**: 预览请求使用300ms防抖
5. **状态持久化**: 考虑使用localStorage保存用户偏好
