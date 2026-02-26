import { describe, expect, it } from 'vitest';
import type { CategoryPreset, FileItem, MixerConfig, TargetRoot } from '../types';
import { buildPreviewOps } from './preview';

const mockMixerConfig: MixerConfig = {
  presetId: null,
  targetRootId: null,
  useRename: true,
  renamePattern: 'RAW_NAME',
  dateSource: 'CURRENT',
  isCollection: false,
  tokens: [],
  selectedTokenIndices: [],
  customPrefix: '',
  tempKeyword: '',
  usePrefix: true,
  useDate: true,
  useOriginal: true,
  selectedTokens: [],
  selectedKeywords: [],
  selectedOrder: [],
};

const mockPreset: CategoryPreset = {
  id: 'preset-1',
  name: 'Travel',
  icon: 'travel',
  color: '#fff',
  targetSubPath: 'photos',
  defaultPrefix: 'TR',
};

const mockTarget: TargetRoot = {
  id: 'target-1',
  name: 'NAS',
  path: '/nas/archive',
  icon: 'folder',
};

const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'sample.JPG',
    path: '/nas/raw',
    type: 'image/jpeg',
    size: '1MB',
    ctime: 0,
    mtime: 0,
  },
];

const mockMultiFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'sample.JPG',
    path: '/nas/raw',
    type: 'image/jpeg',
    size: '1MB',
    ctime: 0,
    mtime: 0,
  },
  {
    id: 'file-2',
    name: 'sample.JPG',
    path: '/nas/raw',
    type: 'image/jpeg',
    size: '1MB',
    ctime: 0,
    mtime: 0,
  },
];

describe('buildPreviewOps random suffix option', () => {
  it('does not append random suffix when disabled', () => {
    const ops = buildPreviewOps(mockFiles, mockMixerConfig, mockPreset, mockTarget, { appendRandomSuffix: false });
    expect(ops).toHaveLength(1);
    expect(ops[0].newName).toBe('sample.jpg');
  });

  it('appends 5-char alphanumeric suffix when enabled', () => {
    const ops = buildPreviewOps(mockFiles, mockMixerConfig, mockPreset, mockTarget, { appendRandomSuffix: true });
    expect(ops).toHaveLength(1);
    expect(ops[0].newName).toMatch(/^sample_[A-Z0-9]{5}\.jpg$/);
  });

  it('adds sequence suffix only when isCollection is true', () => {
    const collectionOps = buildPreviewOps(
      mockMultiFiles,
      { ...mockMixerConfig, isCollection: true },
      mockPreset,
      mockTarget,
      { appendRandomSuffix: false },
    );
    expect(collectionOps[0].newName).toBe('sample_001.jpg');
    expect(collectionOps[1].newName).toBe('sample_002.jpg');

    const batchOps = buildPreviewOps(
      mockMultiFiles,
      { ...mockMixerConfig, isCollection: false },
      mockPreset,
      mockTarget,
      { appendRandomSuffix: false },
    );
    expect(batchOps[0].newName).toBe('sample.jpg');
    expect(batchOps[1].newName).toBe('sample.jpg');
  });
});
