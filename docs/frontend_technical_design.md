# SortFlow 前端技术方案

## 1. 概述
SortFlow 前端旨在提供一个流畅、直观的文件整理工作台。通过可视化的"模式混音器（Pattern Mixer）"，帮助用户高效地对大量非结构化文件（如照片、文档）进行重命名和归档。

本方案基于现有的 React + Vite + TypeScript 架构进行规范化和扩展，重点解决状态管理、性能优化和与真实后端的交互问题。

## 2. 技术栈选型

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **核心框架** | **React 19** | 利用最新的 Hooks 和并发特性。 |
| **构建工具** | **Vite** | 极速的开发服务器和构建性能。 |
| **语言** | **TypeScript 5.x** | 强类型保障，与后端共享类型定义（如可能）。 |
| **样式方案** | **Tailwind CSS** | 实用主义 CSS，配合 `clsx` 或 `tailwind-merge` 实现动态样式。 |
| **状态管理** | **Zustand** | 轻量级全局状态管理（替代 Context API 处理复杂状态）。用于管理`Pattern Mixer`配置、选中文件集合等。 |
| **数据请求** | **TanStack Query (React Query)** | 管理服务端状态（文件列表、任务进度），支持缓存、轮询和乐观更新。 |
| **图标库** | **Material Symbols** | 保持现有的设计风格，使用 Google Fonts 引入。 |
| **路由** | **React Router v6** | 用于多页面导航（Dashboard、Configuration、History）。 |
| **拖拽** | **@dnd-kit/core** | 用于预设排序、文件拖拽等交互。 |
| **框选** | **react-selecto** | 用于文件框选功能。 |

## 3. 架构设计

### 3.1 目录结构
推荐采用 **Feature-based** 结构，将业务逻辑聚合。

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
│   ├── file-explorer/      # 文件浏览、缩略图网格
│   │   ├── FileGrid.tsx
│   │   ├── FileCard.tsx
│   │   ├── SelectionOverlay.tsx
│   │   └── useFileSelection.ts
│   ├── pattern-mixer/      # 重命名规则配置器
│   │   ├── PatternMixer.tsx
│   │   ├── TokenSelector.tsx
│   │   ├── AdvancedRules.tsx
│   │   └── PreviewList.tsx
│   ├── config/             # 配置管理
│   │   ├── AddWatcherModal.tsx
│   │   ├── PresetEditorModal.tsx
│   │   ├── TargetRootModal.tsx
│   │   └── PresetList.tsx
│   ├── execution/          # 任务执行、进度条、日志
│   │   ├── ExecutionView.tsx
│   │   ├── ProgressBar.tsx
│   │   └── LogViewer.tsx
│   ├── history/            # 历史记录
│   │   ├── HistoryList.tsx
│   │   ├── HistoryDetail.tsx
│   │   └── UndoButton.tsx
│   └── dashboard/          # 页面布局容器
│       ├── Dashboard.tsx
│       ├── Sidebar.tsx
│       └── TransactionDesk.tsx
├── hooks/                  # 通用 Hooks
│   ├── useDebounce.ts
│   ├── useKeyPress.ts
│   └── usePolling.ts
├── services/               # API 客户端封装
│   ├── api.ts
│   ├── fileService.ts
│   ├── configService.ts
│   ├── previewService.ts
│   ├── executeService.ts
│   └── historyService.ts
├── store/                  # Zustand Store 定义
│   └── useAppStore.ts
├── types/                  # 全局类型定义
│   └── index.ts
└── utils/                  # 工具函数
    ├── tokenizer.ts
    ├── formatters.ts
    └── validators.ts
```

### 3.2 核心模块设计

#### A. 文件浏览 (File Explorer)
*   **虚拟滚动**: 考虑到可能在一个目录下加载数千张图片，引入 `react-window` 或 `react-virtuoso` 实现虚拟列表渲染，保证 DOM 节点数量恒定，提升性能。
*   **懒加载**: 图片缩略图使用 `IntersectionObserver` 实现懒加载。

#### B. 模式混音器与智能分词 (Pattern Mixer & Smart Tokenization)
*   **设计模式**: 采用 **策略模式 (Strategy Pattern)** 处理不同的重命名规则。
*   **智能分词算法 (Tokenization Engine)**:
    为了让用户能快速从文件名中提取关键信息（如 `IMG_2023_Trip_Tokyo.jpg` -> `Trip`, `Tokyo`），前端实现一套基于正则的高级分词引擎：
    1.  **分隔符拆分**: 使用正则 `/[_\-. \s]+/` 拆分基础片段。
    2.  **驼峰拆分**: 检测并拆分驼峰命名 (e.g., `MyVacation` -> `My`, `Vacation`)。正则逻辑: `/(?=[A-Z])/`。
    3.  **数字分离**: 将连在一起的字母和数字分离 (e.g., `Part01` -> `Part`, `01`)。
    4.  **去噪**: 过滤掉无意义的连接符、极短字符（1个字符，除非是数字）或扩展名。
    5.  **去重**: 移除重复的 Token。
    *此逻辑完全在前端 `utils/tokenizer.ts` 中实现，利用 Web Worker 避免阻塞主线程（当处理大量文件时）。*

*   **实时预览**:
    *   用户调整开关（Prefix, Date, Tokens）时，前端调用 `/api/v1/preview` 获取预览结果。
    *   **Debounce**: 使用 300ms 防抖避免频繁请求。
    *   **Memoization**: 使用 `useMemo` 避免每次渲染都重新计算所有文件的预览名。

#### C. 系统配置管理
*   **源目录 (Source Watchers)**:
    *   **交互**: 点击侧边栏 "+" 按钮 -> 调用系统原生文件选择 API (`window.showDirectoryPicker` - 如果浏览器支持，否则弹窗输入路径或调用后端打开系统对话框接口) -> 乐观更新 UI -> 后端验证并保存。
*   **分类预设 (Category Presets)**:
    *   **交互**: 右键点击预设卡片 (Edit) 或点击空置卡片 (Add) -> 弹出模态框 (Modal) 编辑名称、图标、颜色、目标路径。
    *   **图标选择器**: 集成简单的 Material Symbols 图标选择网格。

#### D. 任务执行 (Execution Engine)
*   **乐观 UI**: 小批量操作可直接在 UI 移除文件。
*   **长任务轮询**: 对于大批量操作，前端发起请求后获得 `taskId`，随即进入轮询模式（Polling）检查 `/tasks/{id}/progress`，直到状态为 `completed`。

## 4. 状态管理模型 (Zustand Store)

```typescript
// store/useAppStore.ts

interface MixerConfig {
  presetId: string;
  targetRootId: string;
  usePrefix: boolean;
  useDate: boolean;
  dateSource: 'exif' | 'fileCreated' | 'now';
  useOriginalName: boolean;
  tokenMode: 'all' | 'selected' | 'regex';
  selectedTokens: string[];
  regexPattern: string;
  customSuffix: string;
}

interface PreviewOperation {
  fileId: string;
  originalPath: string;
  originalName: string;
  targetPath: string;
  newName: string;
  status: 'ready' | 'auto_renamed' | 'error';
  statusReason: string | null;
}

type ExecutionState = 'idle' | 'confirming' | 'executing' | 'done' | 'error';

interface AppStore {
  // === 系统配置 ===
  sourceWatchers: string[];
  targetRoots: TargetRoot[];
  presets: CategoryPreset[];

  // === 文件浏览 ===
  files: FileItem[];
  currentPath: string;
  isLoadingFiles: boolean;

  // === 选择状态 ===
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  selectionAnchorId: string | null;
  isSelecting: boolean;
  selectionRect: { x: number; y: number; width: number; height: number } | null;

  // === Mixer配置 ===
  mixerConfig: MixerConfig;

  // === 预览结果 ===
  previewOps: PreviewOperation[];
  isPreviewLoading: boolean;
  previewError: string | null;
  conflictsResolved: number;

  // === 执行状态 ===
  executionState: ExecutionState;
  currentTaskId: string | null;
  executionProgress: number;
  executionLogs: string[];
  executionError: string | null;

  // === Actions: 文件选择 ===
  selectFile: (id: string, mode: 'single' | 'toggle' | 'range') => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSelectionRect: (rect: { x: number; y: number; width: number; height: number } | null) => void;

  // === Actions: Mixer操作 ===
  updateMixerConfig: (partial: Partial<MixerConfig>) => void;
  toggleToken: (token: string) => void;
  resetMixerConfig: () => void;

  // === Actions: 预览 ===
  fetchPreview: () => Promise<void>;

  // === Actions: 执行 ===
  showConfirmDialog: () => void;
  hideConfirmDialog: () => void;
  executeOperation: () => Promise<void>;
  cancelExecution: () => void;
  resetExecution: () => void;

  // === Actions: 配置管理 ===
  loadConfig: () => Promise<void>;
  addSourceWatcher: (path: string) => Promise<void>;
  removeSourceWatcher: (path: string) => Promise<void>;
  addPreset: (data: PresetFormData) => Promise<void>;
  updatePreset: (id: string, data: Partial<PresetFormData>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  reorderPresets: (orderedIds: string[]) => Promise<void>;
  addTargetRoot: (data: TargetRootFormData) => Promise<void>;
  updateTargetRoot: (id: string, data: Partial<TargetRootFormData>) => Promise<void>;
  deleteTargetRoot: (id: string) => Promise<void>;
}
```

## 5. 性能优化
1.  **缩略图缓存**: 浏览器端缓存缩略图，后端生成缩略图时带上 `Cache-Control`。
2.  **Web Workers**: 如果前端需要解析大量文件的 Exif 信息（在纯前端模式下），应放入 Web Worker 防止阻塞主线程。但在本方案中，建议由后端处理元数据。
3.  **预览防抖**: 调用 `/api/v1/preview` 接口时使用 300ms 防抖，避免频繁请求。
4.  **虚拟滚动**: 文件列表超过 100 个时自动启用虚拟滚动。

## 6. 详细交互逻辑

### 6.1 文件选择交互

| 操作 | 行为 | 状态变更 |
|-----|------|---------|
| **单击文件** | 清除其他选择，选中当前文件 | `selectedIds = new Set([id])`, `lastSelectedId = id` |
| **Ctrl/Cmd + 单击** | 切换当前文件选中状态 | `selectedIds.toggle(id)`, `lastSelectedId = id` |
| **Shift + 单击** | 从上次选中位置到当前位置连续选择 | `selectedIds = range(lastSelectedId, currentId)` |
| **框选拖拽** | 绘制选区，选中区域内所有文件 | 需引入 `react-selecto` 或自实现 |
| **Ctrl/Cmd + A** | 全选当前目录文件 | `selectedIds = all in currentPath` |
| **Esc** | 清除所有选择 | `selectedIds = new Set()`, `lastSelectedId = null` |

**实现代码示例**:
```typescript
// hooks/useFileSelection.ts
export const useFileSelection = () => {
  const { files, currentPath, selectedIds, lastSelectedId } = useAppStore();
  const currentFiles = files.filter(f => f.path === currentPath);

  const handleSelect = useCallback((id: string, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      // Toggle模式
      selectFile(id, 'toggle');
    } else if (event.shiftKey && lastSelectedId) {
      // Range模式
      selectFile(id, 'range');
    } else {
      // Single模式
      selectFile(id, 'single');
    }
  }, [lastSelectedId]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      event.preventDefault();
      selectAll();
    }
    if (event.key === 'Escape') {
      clearSelection();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleSelect, currentFiles };
};
```

### 6.2 源目录管理交互

**添加源目录流程**:
```
用户点击 "+" 按钮
    ↓
显示输入模态框（或调用系统文件选择器）
    ↓
用户输入/选择路径
    ↓
前端验证路径格式
    ↓
前端乐观更新UI，添加临时条目（状态: "validating"）
    ↓
调用 POST /api/v1/system/watchers
    ↓
成功 → 更新为正式条目，刷新文件列表
失败 → 显示错误提示，移除临时条目
```

**模态框组件接口**:
```typescript
interface AddWatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (path: string) => Promise<void>;
}

// 字段验证规则
const validatePath = (path: string): string | null => {
  if (!path) return '路径不能为空';
  if (!path.startsWith('/')) return '路径必须是绝对路径';
  if (path.includes('..')) return '路径不能包含 ..';
  if (!/^[a-zA-Z0-9/_\-. ]+$/.test(path)) return '路径包含非法字符';
  return null;
};
```

**删除确认流程**:
```
用户点击删除图标
    ↓
显示确认对话框: "确定要移除源目录 /path/to/dir 吗？该操作不会删除实际文件。"
    ↓
确认 → 调用 DELETE /api/v1/system/watchers?path=...
    ↓
成功 → 从列表移除
      → 若当前正在浏览该目录则切换到第一个可用目录
      → 清除该目录下已选中的文件
```

### 6.3 分类预设CRUD交互

**预设编辑模态框接口**:
```typescript
interface PresetEditorModalProps {
  mode: 'create' | 'edit';
  preset?: CategoryPreset;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PresetFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

interface PresetFormData {
  name: string;           // 必填，1-20字符
  icon: string;           // 从图标选择器选择
  color: string;          // 预定义颜色列表
  targetSubPath: string;  // 必填，相对路径
  defaultPrefix: string;  // 可选，建议以 _ 结尾
}

// 表单验证规则
const validatePresetForm = (data: PresetFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.name || data.name.length < 1) errors.name = '名称不能为空';
  if (data.name.length > 20) errors.name = '名称不能超过20个字符';
  if (!data.icon) errors.icon = '请选择图标';
  if (!data.targetSubPath) errors.targetSubPath = '目标路径不能为空';
  if (data.targetSubPath.startsWith('/')) errors.targetSubPath = '请使用相对路径';
  return errors;
};
```

**图标选择器**:
```typescript
const AVAILABLE_ICONS = [
  'landscape', 'beach_access', 'child_care', 'receipt', 'article',
  'photo_camera', 'videocam', 'work', 'home', 'favorite',
  'star', 'flight', 'restaurant', 'sports', 'music_note',
  'pets', 'school', 'shopping_cart', 'celebration', 'nature'
];

const AVAILABLE_COLORS = [
  { id: 'primary', name: 'Cyan', class: 'bg-cyan-500' },
  { id: 'indigo', name: 'Indigo', class: 'bg-indigo-500' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
  { id: 'violet', name: 'Violet', class: 'bg-violet-500' },
];
```

**拖拽排序实现**:
```typescript
// 使用 @dnd-kit/core 实现
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = presets.findIndex(p => p.id === active.id);
  const newIndex = presets.findIndex(p => p.id === over.id);

  // 乐观更新
  const reordered = arrayMove(presets, oldIndex, newIndex);
  setPresets(reordered);

  // 调用API持久化
  try {
    await reorderPresets(reordered.map(p => p.id));
  } catch (error) {
    // 回滚
    setPresets(presets);
    showError('排序保存失败');
  }
};
```

### 6.4 目标根目录CRUD交互

**目标根目录模态框接口**:
```typescript
interface TargetRootModalProps {
  mode: 'create' | 'edit';
  target?: TargetRoot;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TargetRootFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

interface TargetRootFormData {
  name: string;   // 必填，显示名称
  path: string;   // 必填，绝对路径
  icon: string;   // 图标名称
}
```

### 6.5 Pattern Mixer 交互逻辑

**日期来源选择**:
```typescript
type DateSource = 'exif' | 'fileCreated' | 'now';

// 当勾选DATE后，显示下拉菜单让用户选择日期来源
// UI示例:
// [x] DATE  ▼ EXIF拍摄日期
//           ├── EXIF拍摄日期 (推荐)
//           ├── 文件创建日期
//           └── 当前日期
```

**Token模式切换**:
```typescript
type TokenMode = 'all' | 'selected' | 'regex';

interface TokenConfig {
  mode: TokenMode;
  selectedTokens: string[];  // mode='selected' 时使用
  regexPattern: string;      // mode='regex' 时使用
}

// UI交互:
// 1. 默认显示分词按钮列表 (mode='selected')
// 2. 用户可点击"高级"展开更多选项
// 3. 高级选项包括:
//    - ( ) 保留全名 (mode='all')
//    - (•) 选择分词 (mode='selected') [默认]
//    - ( ) 正则提取 (mode='regex')
// 4. 选择"正则提取"时显示正则输入框
```

**高级规则面板**:
```typescript
interface AdvancedRulesProps {
  isExpanded: boolean;
  onToggle: () => void;
  tokenMode: TokenMode;
  regexPattern: string;
  onTokenModeChange: (mode: TokenMode) => void;
  onRegexPatternChange: (pattern: string) => void;
}

// 正则表达式预设模板
const REGEX_TEMPLATES = [
  { label: '保留后5位', pattern: '.{5}$' },
  { label: '提取日期', pattern: '\\d{4}[-_]?\\d{2}[-_]?\\d{2}' },
  { label: '提取序号', pattern: '\\d{3,}$' },
];
```

### 6.6 冲突检测与状态指示

**状态指示灯组件**:
```typescript
type ConflictStatus = 'ready' | 'auto_renamed' | 'error';

interface StatusIndicatorProps {
  status: ConflictStatus;
  reason?: string | null;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG = {
  ready: {
    color: 'bg-emerald-500',
    icon: 'check_circle',
    label: 'OK',
    tooltip: '路径正常，无冲突'
  },
  auto_renamed: {
    color: 'bg-amber-500',
    icon: 'warning',
    label: 'Renamed',
    tooltip: '检测到冲突，已自动添加后缀'
  },
  error: {
    color: 'bg-red-500',
    icon: 'error',
    label: 'Error',
    tooltip: '无法写入目标位置'
  }
};

// 冲突原因的本地化显示
const REASON_LABELS: Record<string, string> = {
  batch_conflict: '当前批次内存在同名文件',
  disk_conflict: '目标目录已存在同名文件',
  permission_denied: '目标目录无写入权限',
  disk_full: '磁盘空间不足',
};
```

**预览列表增强**:
```tsx
// features/pattern-mixer/PreviewList.tsx
const PreviewList: React.FC<{ previews: PreviewOperation[] }> = ({ previews }) => {
  const displayPreviews = previews.slice(0, 5);
  const remainingCount = previews.length - 5;

  return (
    <div className="space-y-3">
      <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest">
        Queue Preview
      </span>
      <div className="space-y-2">
        {displayPreviews.map(op => (
          <div key={op.fileId} className="flex items-center gap-3 p-2 rounded-lg bg-surface-dark/30">
            <StatusIndicator status={op.status} reason={op.statusReason} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-500 line-through truncate">
                {op.originalName}
              </div>
              <div className="text-[11px] text-white font-mono truncate">
                {op.newName}
              </div>
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <p className="text-[9px] text-text-secondary/40 pl-6 italic">
            + {remainingCount} more items
          </p>
        )}
      </div>
    </div>
  );
};
```

### 6.7 执行流程交互

**执行状态机**:
```
IDLE (可点击执行按钮)
    ↓ 点击执行
CONFIRMING (显示确认对话框)
    ↓ 取消        ↓ 确认
IDLE          EXECUTING (禁用按钮，显示进度)
                  ↓ 完成        ↓ 失败
              DONE           ERROR
              (显示成功)     (显示错误)
                  ↓ 返回        ↓ 返回
              IDLE          IDLE
```

**确认对话框**:
```tsx
interface ConfirmDialogProps {
  isOpen: boolean;
  selectedCount: number;
  targetPath: string;
  conflictCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, selectedCount, targetPath, conflictCount, onConfirm, onCancel
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="确认执行">
      <div className="space-y-4">
        <p>即将移动 <strong>{selectedCount}</strong> 个文件到:</p>
        <code className="block p-3 bg-surface-dark rounded-lg text-sm">
          {targetPath}
        </code>

        {conflictCount > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400">
              <span className="material-symbols-outlined text-lg">warning</span>
              <span className="text-sm font-medium">
                有 {conflictCount} 个文件将被自动重命名以避免冲突
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            取消
          </Button>
          <Button variant="primary" onClick={onConfirm} className="flex-1">
            确认执行
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

**进度轮询逻辑**:
```typescript
// hooks/useTaskPolling.ts
export const useTaskPolling = (taskId: string | null) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    let cancelled = false;
    const pollInterval = 500; // 500ms

    const poll = async () => {
      if (cancelled) return;

      try {
        const res = await fetch(`/api/v1/tasks/${taskId}`);
        const data = await res.json();

        setProgress(data.progress);
        setLogs(data.logs || []);
        setStatus(data.status);

        if (data.status === 'completed') {
          // 完成，停止轮询
          return;
        } else if (data.status === 'failed') {
          setError(data.error || '执行失败');
          return;
        } else {
          // 继续轮询
          setTimeout(poll, pollInterval);
        }
      } catch (err) {
        if (!cancelled) {
          setError('无法获取任务状态');
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  return { progress, logs, status, error };
};
```

### 6.8 历史记录页面交互

**历史记录列表**:
```tsx
// features/history/HistoryList.tsx
const HistoryList: React.FC = () => {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
    ['history'],
    ({ pageParam = 1 }) => fetchHistory(pageParam),
    { getNextPageParam: (lastPage) => lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined }
  );

  const handleUndo = async (historyId: string) => {
    const confirmed = await showConfirm('确定要撤销这次操作吗？文件将被移回原始位置。');
    if (!confirmed) return;

    try {
      const { taskId } = await undoOperation(historyId);
      // 跳转到执行进度视图或显示进度toast
      showProgress(taskId);
    } catch (error) {
      showError('撤销失败: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      {data?.pages.flatMap(page => page.items).map(item => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-surface-dark rounded-2xl">
          <div className="flex items-center gap-4">
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <span className="material-symbols-outlined">
                {item.action === 'move' ? 'drive_file_move' : 'file_copy'}
              </span>
            </div>
            <div>
              <p className="font-bold text-white">{item.summary}</p>
              <p className="text-xs text-slate-400">
                {formatRelativeTime(item.timestamp)} · {item.fileCount} 个文件
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.canUndo && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleUndo(item.id)}
              >
                <span className="material-symbols-outlined text-lg">undo</span>
                撤销
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => showDetail(item.id)}>
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </Button>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <Button variant="ghost" onClick={() => fetchNextPage()} className="w-full">
          加载更多
        </Button>
      )}
    </div>
  );
};
```

## 7. API 调用时序图

```
┌─────────┐          ┌─────────┐          ┌─────────┐
│  User   │          │ Frontend │          │ Backend │
└────┬────┘          └────┬────┘          └────┬────┘
     │  应用启动          │                    │
     │                    │  GET /system/config│
     │                    ├───────────────────>│
     │                    │    配置数据         │
     │                    │<───────────────────┤
     │   显示工作台        │                    │
     │<───────────────────┤                    │
     │                    │                    │
     │  选择源目录         │                    │
     ├───────────────────>│                    │
     │                    │  GET /files/list   │
     │                    ├───────────────────>│
     │                    │    文件列表         │
     │                    │<───────────────────┤
     │   显示文件网格      │                    │
     │<───────────────────┤                    │
     │                    │                    │
     │  选择文件/改选项    │                    │
     ├───────────────────>│                    │
     │                    │  POST /preview     │
     │                    │  (debounce 300ms)  │
     │                    ├───────────────────>│
     │                    │                    │ 计算冲突
     │                    │    预览结果        │
     │                    │<───────────────────┤
     │   显示预览+状态灯   │                    │
     │<───────────────────┤                    │
     │                    │                    │
     │  点击执行           │                    │
     ├───────────────────>│                    │
     │   显示确认对话框    │                    │
     │<───────────────────┤                    │
     │                    │                    │
     │  确认               │                    │
     ├───────────────────>│                    │
     │                    │ POST /organize/execute
     │                    ├───────────────────>│
     │                    │   { taskId }       │
     │                    │<───────────────────┤
     │                    │                    │
     │                    │ GET /tasks/{id}    │
     │   显示进度          │  (polling 500ms)  │
     │<───────────────────┼───────────────────>│
     │                    │<───────────────────┤
     │                    │        ...         │
     │   完成/错误         │                    │
     │<───────────────────┤                    │
     │                    │                    │
     │  查看历史           │                    │
     ├───────────────────>│                    │
     │                    │  GET /history      │
     │                    ├───────────────────>│
     │                    │    历史列表        │
     │                    │<───────────────────┤
     │   显示历史记录      │                    │
     │<───────────────────┤                    │
```

## 8. 需要新增的组件清单

| 组件名 | 路径 | 用途 | 优先级 |
|-------|------|------|-------|
| `Modal` | `components/Modal.tsx` | 通用模态框基础组件 | P0 |
| `ConfirmDialog` | `components/ConfirmDialog.tsx` | 通用确认对话框 | P0 |
| `Button` | `components/Button.tsx` | 统一按钮样式 | P0 |
| `StatusIndicator` | `components/StatusIndicator.tsx` | 冲突状态指示灯 | P0 |
| `IconPicker` | `components/IconPicker.tsx` | 图标选择网格 | P1 |
| `ColorPicker` | `components/ColorPicker.tsx` | 颜色选择器 | P1 |
| `AddWatcherModal` | `features/config/AddWatcherModal.tsx` | 添加源目录模态框 | P1 |
| `PresetEditorModal` | `features/config/PresetEditorModal.tsx` | 预设增删改模态框 | P1 |
| `TargetRootModal` | `features/config/TargetRootModal.tsx` | 目标根目录模态框 | P1 |
| `SelectionOverlay` | `features/file-explorer/SelectionOverlay.tsx` | 框选覆盖层 | P2 |
| `TokenSelector` | `features/pattern-mixer/TokenSelector.tsx` | 分词选择器增强版 | P1 |
| `AdvancedRules` | `features/pattern-mixer/AdvancedRules.tsx` | 高级规则面板 | P2 |
| `PreviewList` | `features/pattern-mixer/PreviewList.tsx` | 预览列表组件 | P0 |
| `HistoryList` | `features/history/HistoryList.tsx` | 历史记录列表 | P1 |
| `HistoryDetail` | `features/history/HistoryDetail.tsx` | 历史详情页 | P2 |
| `UndoButton` | `features/history/UndoButton.tsx` | 撤销按钮 | P1 |

## 9. 构建与部署
*   **环境区分**: `.env.development` (Mock API) vs `.env.production` (Real Backend)。
*   **Docker化**: 前端构建为静态资源，通过 Nginx 托管，或直接由后端（FastAPI）提供静态文件服务。
