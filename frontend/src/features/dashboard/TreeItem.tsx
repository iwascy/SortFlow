import React, { useState, useEffect } from 'react';
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
      // Filter directories and sort alphabetically
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

  useEffect(() => {
    if (isExpanded) {
      void fetchChildren();
    }
  }, [isExpanded]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPath(path);
    if (!isExpanded) {
        setIsExpanded(true);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer group",
          isActive
            ? 'bg-primary/10 text-primary font-bold shadow-sm ring-1 ring-primary/20'
            : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={handleSelect}
      >
        <button
            onClick={toggleExpand}
            className="p-0.5 rounded-md hover:bg-black/5 text-text-tertiary transition-colors"
        >
            <span className={cn(
            "material-symbols-outlined text-[18px] transition-transform duration-200 block",
            isExpanded ? "rotate-90" : "",
            isActive ? "text-primary" : "text-text-tertiary group-hover:text-text-secondary",
            (hasLoaded && children.length === 0) ? "opacity-30 pointer-events-none" : "opacity-100"
            )}>
            chevron_right
            </span>
        </button>

        <span className={cn(
          "material-symbols-outlined text-[20px]",
          isActive ? "filled text-primary" : "text-text-tertiary group-hover:text-primary/70"
        )}>
          {path.includes('nas') ? 'dns' : (depth === 0 ? 'sd_card' : 'folder')}
        </span>
        <span className="truncate flex-1">{name}</span>
        {isLoading && (
          <span className="material-symbols-outlined text-[14px] animate-spin text-primary">
            progress_activity
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="flex flex-col mt-0.5">
          {children.map((child) => (
            <TreeItem
              key={child.sourcePath || child.id} // Use sourcePath or ID as key
              path={child.sourcePath || `${path}/${child.name}`} // Construct path if sourcePath missing (mock data fallback)
              name={child.name}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
