import { create } from 'zustand';
import type {
  FileItem,
  TargetRoot,
  CategoryPreset,
  MixerConfig,
  PreviewOperation,
  ExecutionState,
  AppConfig
} from '../types';

interface AppState {
  // System Config
  config: AppConfig;
  targetRoots: TargetRoot[];
  presets: CategoryPreset[];

  // File Explorer
  files: FileItem[];
  currentPath: string;
  isLoadingFiles: boolean;

  // Selection
  selectedIds: Set<string>;
  lastSelectedId: string | null;

  // Mixer Config
  mixerConfig: MixerConfig;

  // Preview
  previewOps: PreviewOperation[];
  isPreviewLoading: boolean;

  // Execution
  executionState: ExecutionState;

  // Actions
  setConfig: (config: Partial<AppConfig>) => void;
  setTargetRoots: (roots: TargetRoot[]) => void;
  setPresets: (presets: CategoryPreset[]) => void;

  setFiles: (files: FileItem[]) => void;
  setIsLoadingFiles: (loading: boolean) => void;
  setCurrentPath: (path: string) => void;

  setSelectedIds: (ids: Set<string>) => void;
  toggleSelection: (id: string, multi: boolean, range: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  updateMixerConfig: (config: Partial<MixerConfig>) => void;

  setPreviewOps: (ops: PreviewOperation[]) => void;
  setIsPreviewLoading: (loading: boolean) => void;

  setExecutionState: (state: Partial<ExecutionState>) => void;
}

const DEFAULT_MIXER_CONFIG: MixerConfig = {
  presetId: null,
  targetRootId: null,
  useRename: true,
  renamePattern: 'PREFIX',
  dateSource: 'CURRENT',
  tokens: [],
  selectedTokenIndices: [],
  customPrefix: '',
};

const DEFAULT_EXECUTION_STATE: ExecutionState = {
  status: 'IDLE',
  taskId: null,
  progress: 0,
  totalFiles: 0,
  processedFiles: 0,
  logs: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  config: { sourceWatchers: [], theme: 'light' },
  targetRoots: [],
  presets: [],

  files: [],
  currentPath: '',
  isLoadingFiles: false,

  selectedIds: new Set(),
  lastSelectedId: null,

  mixerConfig: DEFAULT_MIXER_CONFIG,

  previewOps: [],
  isPreviewLoading: false,

  executionState: DEFAULT_EXECUTION_STATE,

  // Actions
  setConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
  setTargetRoots: (roots) => set({ targetRoots: roots }),
  setPresets: (presets) => set({ presets }),

  setFiles: (files) => set({ files }),
  setIsLoadingFiles: (loading) => set({ isLoadingFiles: loading }),
  setCurrentPath: (path) => set({ currentPath: path }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelection: (id, multi, range) => {
    const { selectedIds, files, lastSelectedId } = get();
    const newSelected = new Set(multi ? selectedIds : []);

    if (range && lastSelectedId) {
      const lastIdx = files.findIndex(f => f.id === lastSelectedId);
      const currIdx = files.findIndex(f => f.id === id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        for (let i = start; i <= end; i++) {
          newSelected.add(files[i].id);
        }
      } else {
        newSelected.add(id);
      }
    } else {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }

    set({ selectedIds: newSelected, lastSelectedId: id });
  },

  selectAll: () => {
    const { files } = get();
    set({ selectedIds: new Set(files.map(f => f.id)) });
  },

  clearSelection: () => set({ selectedIds: new Set(), lastSelectedId: null }),

  updateMixerConfig: (config) => set((state) => ({ mixerConfig: { ...state.mixerConfig, ...config } })),

  setPreviewOps: (ops) => set({ previewOps: ops }),
  setIsPreviewLoading: (loading) => set({ isPreviewLoading: loading }),

  setExecutionState: (newState) => set((state) => ({
    executionState: { ...state.executionState, ...newState }
  })),
}));
