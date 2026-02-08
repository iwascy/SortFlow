import React, { useEffect, useMemo, useState } from 'react';
import type { FileItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { isMediaFileName } from '../../utils/media';
import { cn } from '../../utils/cn';
import { FileCard } from './FileCard';
import { FileTable } from './FileTable';
import { MediaPreviewOverlay } from './MediaPreviewOverlay';

export const FileGrid: React.FC = () => {
  const { files, currentPath, selectedIds, toggleSelection, setCurrentPath, config } = useAppStore();

  const [sortField, setSortField] = useState<'created' | 'updated' | 'name'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table as per spec
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const currentFiles = files
    .filter(f => f.path === currentPath)
    .filter(f => !config.hideNonMedia || f.isDir || isMediaFileName(f.name));

  const sortedFiles = useMemo(() => {
    const items = [...currentFiles];
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) {
        return a.isDir ? -1 : 1; // Dirs first
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

  // Calculate File Type Stats for the "Ratio Bar"
  const stats = useMemo(() => {
     const counts = { doc: 0, image: 0, video: 0, audio: 0, other: 0, total: 0 };
     currentFiles.forEach(f => {
         if (f.isDir) return;
         counts.total++;
         const ext = f.name.split('.').pop()?.toLowerCase();
         if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp', 'tiff'].includes(ext || '')) counts.image++;
         else if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(ext || '')) counts.video++;
         else if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(ext || '')) counts.audio++;
         else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(ext || '')) counts.doc++;
         else counts.other++;
     });
     return counts;
  }, [currentFiles]);

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

  const handleFileClick = (file: FileItem, e: React.MouseEvent) => {
      toggleSelection(file.id, e.ctrlKey || e.metaKey || isMultiSelect, e.shiftKey);
  };

  const handleFileDoubleClick = (file: FileItem) => {
      if (file.isDir && file.sourcePath) {
        setCurrentPath(file.sourcePath);
        return;
      }
      if (!file.isDir && isMediaFileName(file.name)) {
        setPreviewFile(file);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg-surface)]">
      {/* File Type Ratio Bar */}
      {stats.total > 0 && (
          <div className="px-8 pt-6 pb-2">
             <div className="flex h-3 w-full rounded-full overflow-hidden bg-bg-muted">
                {stats.doc > 0 && <div style={{width: `${(stats.doc/stats.total)*100}%`}} className="bg-blue-400 h-full" title={`Documents: ${stats.doc}`} />}
                {stats.image > 0 && <div style={{width: `${(stats.image/stats.total)*100}%`}} className="bg-purple-500 h-full" title={`Images: ${stats.image}`} />}
                {stats.video > 0 && <div style={{width: `${(stats.video/stats.total)*100}%`}} className="bg-pink-400 h-full" title={`Videos: ${stats.video}`} />}
                {stats.audio > 0 && <div style={{width: `${(stats.audio/stats.total)*100}%`}} className="bg-yellow-400 h-full" title={`Audio: ${stats.audio}`} />}
                {stats.other > 0 && <div style={{width: `${(stats.other/stats.total)*100}%`}} className="bg-slate-300 h-full" title={`Others: ${stats.other}`} />}
             </div>
             <div className="flex gap-4 mt-3 text-[10px] uppercase font-bold text-text-secondary tracking-widest">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-400"/> Docs</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-purple-500"/> Images</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-pink-400"/> Video</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-300"/> Other</span>
             </div>
          </div>
      )}

      {/* Toolbar */}
      <div className="px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
          <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'table' ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-bg-muted")}
              >
                  <span className="material-symbols-outlined">table_rows</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-bg-muted")}
              >
                  <span className="material-symbols-outlined">grid_view</span>
              </button>
          </div>

          <div className="flex items-center gap-3">
             <button
                type="button"
                onClick={() => setIsMultiSelect(prev => !prev)}
                aria-pressed={isMultiSelect}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                  isMultiSelect
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-text-secondary border-border hover:border-primary/30"
                )}
                title={isMultiSelect ? 'Multi-select ON' : 'Multi-select OFF'}
              >
                Select
              </button>
             <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-1">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-text-secondary outline-none px-2 py-1.5 cursor-pointer hover:text-primary transition-colors appearance-none"
                >
                    <option value="updated">Updated</option>
                    <option value="created">Created</option>
                    <option value="name">Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="px-2 py-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1 border-l border-border"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}>arrow_downward</span>
                </button>
             </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-8 pb-40 animate-in fade-in duration-500">
         {viewMode === 'table' ? (
             <FileTable
                files={sortedFiles}
                selectedIds={selectedIds}
                onFileClick={handleFileClick}
                onFileDoubleClick={handleFileDoubleClick}
             />
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {sortedFiles.map((file, idx) => (
                <FileCard
                  key={file.id}
                  file={file}
                  selected={selectedIds.has(file.id)}
                  onClick={(e) => toggleSelection(file.id, e.ctrlKey || e.metaKey || isMultiSelect, e.shiftKey)}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                  animationDelay={`${(idx % 10) * 50}ms`}
                />
              ))}
            </div>
         )}
      </div>

      <MediaPreviewOverlay file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
