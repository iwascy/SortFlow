
export type FileType = 'JPG' | 'RAW' | 'MOV' | 'PNG' | 'PDF';

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: FileType;
  path: string;
  thumbnail?: string;
  selected?: boolean;
  alt?: string;
}

export interface TargetRoot {
  id: string;
  name: string;
  path: string;
  icon: string;
}

export interface CategoryPreset {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetSubPath: string;
  defaultPrefix: string;
}

export interface RenameOp {
  id: string;
  originalName: string;
  newName: string;
  originalPath: string;
  newPath: string;
  status: 'pending' | 'conflict' | 'success';
}

export interface TaskStatus {
  id: string;
  name: string;
  progress: number;
  total: number;
  status: 'active' | 'completed';
  timeRemaining?: string;
}
