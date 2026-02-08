import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { fileService } from '../../services/fileService';
import { cn } from '../../utils/cn';
import type { FileItem } from '../../types';

interface TreeItemProps {
  path: string;
  name: string;
  depth: number;
}

export const TreeItem: React.FC<TreeItemProps> = ({ path, name, depth }) => {
  const { currentPath, setCurrentPath } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [children, setChildren] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const isActive = currentPath === path;

  const fetchChildren = async () => {
    if (hasLoaded || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fileService.listFiles(path);
      const dirs = response.files
        .filter(f => f.isDir)
        .sort((a, b) => a.name.localeCompare(b.name));
      setChildren(dirs);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load subdirectories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isExpanded) {
      void fetchChildren();
    }
  }, [isExpanded]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    setCurrentPath(path);
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={toggleExpand}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all group",
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary'
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <span className={cn(
          "material-symbols-outlined text-[16px] transition-transform duration-200",
          isExpanded ? "rotate-90" : "",
          isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary",
          (hasLoaded && children.length === 0) ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          arrow_right
        </span>
        <span className={cn(
          "material-symbols-outlined text-[18px]",
          isActive ? "filled text-primary" : "text-amber-500"
        )}>
          {path.includes('nas') ? 'dns' : (depth === 0 ? 'folder_open' : 'folder')}
        </span>
        <span className="truncate">{name}</span>
        {isLoading && (
          <span className="material-symbols-outlined text-[14px] animate-spin ml-auto text-primary">
            progress_activity
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col mt-0.5">
          {children.map((child) => (
            <TreeItem
              key={child.sourcePath || child.id}
              path={child.sourcePath || ''}
              name={child.name}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
