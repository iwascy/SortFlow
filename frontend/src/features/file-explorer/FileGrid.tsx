import React, { useEffect, useMemo, useState } from 'react';
import type { FileItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { isMediaFileName, isImageFileName, isVideoFileName } from '../../utils/media';
import { cn } from '../../utils/cn';
import { FileCard } from './FileCard';
import { MediaPreviewOverlay } from './MediaPreviewOverlay';

const FILTER_TABS = [
  { id: 'all', label: 'All files', color: 'bg-primary' },
  { id: 'documents', label: 'Documents', color: 'bg-blue-500' },
  { id: 'images', label: 'Images', color: 'bg-purple-500' },
  { id: 'videos', label: 'Videos', color: 'bg-pink-500' },
  { id: 'audio', label: 'Audio', color: 'bg-orange-500' },
];

export const FileGrid: React.FC = () => {
  const { files, currentPath, selectedIds, toggleSelection, setCurrentPath, config } = useAppStore();

  const [sortField, setSortField] = useState<'created' | 'updated' | 'name'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const currentFiles = useMemo(() => {
    return files.filter(f => {
      // 1. Path check
      if (f.path !== currentPath) return false;

      // 2. Hide non-media config check
      if (config.hideNonMedia && !f.isDir && !isMediaFileName(f.name)) return false;

      // 3. Tab filter
      if (activeTab === 'all') return true;
      if (f.isDir) return true; // Always show folders

      if (activeTab === 'images') return isImageFileName(f.name);
      if (activeTab === 'videos') return isVideoFileName(f.name);

      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (activeTab === 'audio') return ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(ext);
      if (activeTab === 'documents') return ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json', 'xml'].includes(ext);

      return true;
    });
  }, [files, currentPath, config.hideNonMedia, activeTab]);

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
      <div className="flex-1 overflow-y-auto p-8 pb-40 animate-in fade-in duration-500 fill-mode-both bg-gray-50/30">

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border",
                activeTab === tab.id
                  ? 'bg-white border-gray-200 text-text-primary shadow-sm ring-1 ring-black/5'
                  : 'bg-transparent border-transparent text-text-tertiary hover:bg-white hover:text-text-primary hover:shadow-sm'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-text-primary tracking-tight">
            {activeTab === 'all' ? 'All files' : FILTER_TABS.find(t => t.id === activeTab)?.label}
          </h2>

          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                <button
                    onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="p-2 rounded-lg hover:bg-gray-50 text-text-secondary transition-colors"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                    <span className="material-symbols-outlined text-[20px]">{sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
                </button>
                <div className="h-4 w-px bg-gray-200"></div>
                <select
                    value={sortField}
                    onChange={(event) => setSortField(event.target.value as 'created' | 'updated' | 'name')}
                    className="bg-transparent border-none text-xs font-bold text-text-secondary focus:ring-0 cursor-pointer pr-8"
                >
                    <option value="name">Name</option>
                    <option value="updated">Date Modified</option>
                    <option value="created">Date Created</option>
                </select>
             </div>

            <button
              onClick={() => setIsMultiSelect(prev => !prev)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider shadow-sm",
                isMultiSelect
                  ? "bg-primary text-white border-primary shadow-primary/20"
                  : "bg-white text-text-secondary border-gray-200 hover:border-gray-300 hover:text-text-primary"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">checklist</span>
              Select
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
              style={{ animationDelay: `${(idx % 20) * 30}ms` }}
            />
          ))}
          {sortedFiles.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-text-tertiary">
                <span className="material-symbols-outlined text-6xl opacity-20 mb-4">folder_open</span>
                <p className="text-sm font-medium">No files found in this directory</p>
             </div>
          )}
        </div>
      </div>
      <MediaPreviewOverlay file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
};
