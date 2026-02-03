import type { TaskStatus, FileItem, CategoryPreset, TargetRoot } from './types';

export const INITIAL_FILES: FileItem[] = [
  { id: '1', name: 'DSC001.jpg', size: '2.4MB', type: 'JPG', path: '/nas/upload/raw', thumbnail: 'https://picsum.photos/id/10/400/400', alt: 'Scenic mountain landscape', mtime: Date.now() },
  { id: '2', name: 'DSC002.ARW', size: '24.8MB', type: 'RAW', path: '/nas/upload/raw', thumbnail: 'https://picsum.photos/id/11/400/400', alt: 'Forest trees sunlight', mtime: Date.now() },
  { id: '3', name: 'DSC003.jpg', size: '3.1MB', type: 'JPG', path: '/nas/upload/raw', thumbnail: 'https://picsum.photos/id/12/400/400', alt: 'Camera lens', mtime: Date.now() },
  { id: '4', name: 'MOV_004.mp4', size: '45MB', type: 'MOV', path: '/mnt/sdcard/dcim', thumbnail: 'https://picsum.photos/id/13/400/400', alt: 'Mountain view', mtime: Date.now() },
  { id: '5', name: 'IMG_005.png', size: '1.2MB', type: 'PNG', path: '/mnt/sdcard/dcim', thumbnail: 'https://picsum.photos/id/14/400/400', alt: 'Travel landscape', mtime: Date.now() },
  { id: '6', name: 'DSC006.jpg', size: '2.2MB', type: 'JPG', path: '/mnt/sdcard/dcim', thumbnail: 'https://picsum.photos/id/15/400/400', alt: 'Portrait outdoors', mtime: Date.now() },
  { id: '7', name: 'DSC007.jpg', size: '2.5MB', type: 'JPG', path: '/nas/upload/raw', thumbnail: 'https://picsum.photos/id/16/400/400', alt: 'Yosemite valley', mtime: Date.now() },
  { id: '8', name: 'DSC008.jpg', size: '2.1MB', type: 'JPG', path: '/mnt/download', thumbnail: 'https://picsum.photos/id/17/400/400', alt: 'Nature landscape', mtime: Date.now() },
  { id: '9', name: 'DSC009.jpg', size: '2.8MB', type: 'JPG', path: '/mnt/download', thumbnail: 'https://picsum.photos/id/18/400/400', alt: 'Foggy forest', mtime: Date.now() },
  { id: '10', name: 'DSC010.jpg', size: '2.3MB', type: 'JPG', path: '/mnt/download', thumbnail: 'https://picsum.photos/id/19/400/400', alt: 'Deep forest texture', mtime: Date.now() },
];

export const PRESETS: CategoryPreset[] = [
  { id: 'scenery', name: 'Scenery', icon: 'landscape', color: 'indigo', targetSubPath: 'Travel/Scenery', defaultPrefix: 'TR_' },
  { id: 'vacation', name: 'Vacation', icon: 'beach_access', color: 'primary', targetSubPath: 'Vacation', defaultPrefix: 'VAC_' },
  { id: 'kids', name: 'Kids', icon: 'child_care', color: 'amber', targetSubPath: 'Family/Kids', defaultPrefix: 'KID_' },
  { id: 'receipts', name: 'Receipts', icon: 'receipt', color: 'emerald', targetSubPath: 'Finance/Receipts', defaultPrefix: 'REC_' },
  { id: 'documents', name: 'Documents', icon: 'article', color: 'emerald', targetSubPath: 'Docs/Scans', defaultPrefix: 'DOC_' },
];

export const TARGET_ROOTS: TargetRoot[] = [
  { id: 'nas-photos', name: 'NAS Photos', path: '/mnt/nas/photos/2024', icon: 'dns' },
  { id: 'cloud-backup', name: 'Cloud Backup', path: '/cloud/backups/archive', icon: 'cloud_done' },
  { id: 'local-ssd', name: 'Local SSD', path: '/Volumes/SSD_PRO/Work', icon: 'memory' },
];

export const MOCK_TASKS: TaskStatus[] = [
  { id: 't1', name: 'Move to Travel/Scenery', progress: 142, total: 450, status: 'active', timeRemaining: '~2m remaining' },
  { id: 't2', name: 'Rename Series: Office', progress: 24, total: 24, status: 'completed' },
  { id: 't3', name: 'Backup: Raw Dumps', progress: 850, total: 850, status: 'completed' },
];
