export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  mtime: number;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface TargetRoot {
  id: string;
  path: string;
  name: string;
  icon?: string;
}

export interface CategoryPreset {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetSubPath: string;
  defaultPrefix?: string;
}

export interface MixerConfig {
  presetId: string | null;
  targetRootId: string | null;
  useRename: boolean;
  renamePattern: 'PREFIX' | 'DATE' | 'RAW_NAME';
  dateSource: 'EXIF' | 'FILE_CREATED' | 'CURRENT';
  tokens: string[];
  selectedTokenIndices: number[];
  customPrefix: string;
}

export type PreviewStatus = 'ready' | 'auto_renamed' | 'error';

export interface PreviewOperation {
  fileId: string;
  originalName: string;
  newName: string;
  status: PreviewStatus;
  statusReason?: string;
  targetPath: string;
}

export type ExecutionStatus = 'IDLE' | 'CONFIRMING' | 'EXECUTING' | 'DONE' | 'ERROR';

export interface ExecutionState {
  status: ExecutionStatus;
  taskId: string | null;
  progress: number; // 0-100
  totalFiles: number;
  processedFiles: number;
  logs: string[];
  error?: string;
}

export interface AppConfig {
  sourceWatchers: string[];
  theme: 'light' | 'dark';
}
