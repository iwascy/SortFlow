import React, { useEffect, useMemo, useState } from 'react';
import type { FileItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { isMediaFileName } from '../../utils/media';
import { cn } from '../../utils/cn';
import { FileCard } from './FileCard';
import { MediaPreviewOverlay } from './MediaPreviewOverlay';

export const FileGrid: React.FC = () => {
  const { files, currentPath, selectedIds, toggleSelection, setCurrentPath, config } = useAppStore();

  const [sortField, setSortField] = useState<'created' | 'updated' | 'name'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const currentFiles = files
    .filter(f => f.path === currentPath)
    .filter(f => !config.hideNonMedia || f.isDir || isMediaFileName(f.name));

  const sortedFiles = useMemo(() => {
    const items = [...currentFiles];
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) {
        return a.isDir ? -1 : 1;
      }
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const aValue = sortField === 'created' ? a.ctime : a.mtime;
      const bValue = sortField === 'created' ? b.ctime : b.mtime;
      const cmp = aValue - bValue;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [currentFiles, sortField, sortOrder]);

  useEffect(() => {
    const openPreview = () => {
      const selectedMediaFile = sortedFiles.find(file => selectedIds.has(file.id) && !file.isDir && isMediaFileName(file.name));
      if (!selectedMediaFile) {
        return;
      }
      setPreviewFile(selectedMediaFile);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ' ' || previewFile) {
        return;
      }

      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      event.preventDefault();
      openPreview();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [previewFile, selectedIds, sortedFiles]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-10 pb-40 animate-in fade-in duration-1000 delay-200 fill-mode-both">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">
            File List
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border-dark bg-surface-dark/60 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">
            <span className="text-text-secondary">排序</span>
            <select
              value={sortField}
              onChange={(event) => setSortField(event.target.value as 'created' | 'updated' | 'name')}
              className="bg-black/30 border border-border-dark rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
            >
              <option value="created">创建时间</option>
              <option value="updated">更新时间</option>
              <option value="name">文件名</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-2 rounded-lg border border-border-dark bg-black/30 hover:border-primary/40"
              title={sortOrder === 'asc' ? '升序' : '降序'}
            >
              {sortOrder === 'asc' ? '升序' : '降序'}
            </button>
            <div className="w-px h-4 bg-border-dark" />
            <button
              type="button"
              onClick={() => setIsMultiSelect(prev => !prev)}
              aria-pressed={isMultiSelect}
              className={cn(
                "px-3 py-2 rounded-lg border transition-colors",
                isMultiSelect
                  ? "bg-primary text-slate-900 border-primary shadow-lg"
                  : "bg-black/30 text-white border-border-dark hover:border-primary/40"
              )}
              title={isMultiSelect ? '多选已开启' : '开启多选'}
            >
              多选
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {sortedFiles.map((file, idx) => (
            <FileCard
              key={file.id}
              file={file}
              selected={selectedIds.has(file.id)}
              onClick={(e) => toggleSelection(file.id, e.ctrlKey || e.metaKey || isMultiSelect, e.shiftKey)}
              onDoubleClick={() => {
                if (file.isDir && file.sourcePath) {
                  setCurrentPath(file.sourcePath);
                  return;
                }

                if (!file.isDir && isMediaFileName(file.name)) {
                  setPreviewFile(file);
                }
              }}
              animationDelay={`${(idx % 10) * 50}ms`}
            />
          ))}
        </div>
      </div>
      <MediaPreviewOverlay file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
};
