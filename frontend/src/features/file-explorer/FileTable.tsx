import React from 'react';
import type { FileItem } from '../../types';
import { cn } from '../../utils/cn';
import { isMediaFileName, formatSize } from '../../utils/media';

interface FileTableProps {
  files: FileItem[];
  onFileClick: (file: FileItem, e: React.MouseEvent) => void;
  onFileDoubleClick: (file: FileItem) => void;
  selectedIds: Set<string>;
}

export const FileTable: React.FC<FileTableProps> = ({ files, onFileClick, onFileDoubleClick, selectedIds }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] font-medium">
          <tr>
            <th className="px-6 py-4 rounded-tl-xl font-semibold">Name</th>
            <th className="px-6 py-4 font-semibold w-32">Size</th>
            <th className="px-6 py-4 font-semibold w-48">Date Modified</th>
            <th className="px-6 py-4 rounded-tr-xl font-semibold w-20 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 bg-white">
          {files.map((file) => {
            const isSelected = selectedIds.has(file.id);
            const isMedia = !file.isDir && isMediaFileName(file.name);

            return (
              <tr
                key={file.id}
                onClick={(e) => onFileClick(file, e)}
                onDoubleClick={() => onFileDoubleClick(file)}
                className={cn(
                  "transition-colors cursor-pointer group hover:bg-[var(--color-bg-muted)]",
                  isSelected ? "bg-primary/5 hover:bg-primary/10" : ""
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-10 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors",
                      file.isDir ? "bg-amber-100 text-amber-600" :
                      isMedia ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
                    )}>
                      <span className="material-symbols-outlined filled">
                        {file.isDir ? 'folder' : isMedia ? 'image' : 'description'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={cn(
                        "font-medium truncate max-w-[200px] lg:max-w-[300px]",
                        isSelected ? "text-primary-dark" : "text-text-primary"
                      )}>
                        {file.name}
                      </span>
                      {isMedia && (
                         <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                            {file.name.split('.').pop()}
                         </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                  {file.isDir ? '--' : formatSize(typeof file.size === 'number' ? file.size : 0)}
                </td>
                <td className="px-6 py-4 text-text-secondary text-xs">
                  {new Date(file.mtime).toLocaleDateString()} <span className="text-text-muted ml-1">{new Date(file.mtime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="p-2 rounded-lg hover:bg-bg-muted text-text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {files.length === 0 && (
        <div className="py-20 text-center text-text-muted flex flex-col items-center">
            <div className="size-16 bg-bg-muted rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl opacity-50">search_off</span>
            </div>
            <p className="font-medium">No files found</p>
            <p className="text-xs mt-1 opacity-70">Try changing filters or directory</p>
        </div>
      )}
    </div>
  );
};
