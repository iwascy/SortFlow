import { useQuery } from '@tanstack/react-query';
import { fileService } from '../../services/fileService';
import { useAppStore } from '../../store/useAppStore';
import { useEffect } from 'react';
import { FileCard } from './FileCard';

export const FileGrid = () => {
  const { setFiles, files, currentPath, selectedIds, toggleSelection, clearSelection } = useAppStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => fileService.listFiles(currentPath),
  });

  useEffect(() => {
    if (data?.files) {
      setFiles(data.files);
    }
  }, [data, setFiles]);

  const handleFileClick = (e: React.MouseEvent, fileId: string) => {
    // Basic selection logic - can be moved to a hook later
    const isMulti = e.ctrlKey || e.metaKey;
    const isRange = e.shiftKey;

    // If clicking on background (not implemented here yet) or just plain click without modifiers
    if (!isMulti && !isRange) {
        // This logic mimics standard OS behavior:
        // Single click selects only this one (clears others)
        // Note: The store's toggleSelection logic is a bit simple, we might need to enhance it
        // For now, let's just clear if not multi
        if (selectedIds.size > 0 && !selectedIds.has(fileId)) {
             // In a real OS, if you click one, others deserialize.
             // But for now, we rely on toggleSelection.
             // Let's manually handle "select only this one"
             clearSelection();
             toggleSelection(fileId, true, false);
             return;
        }
        if (selectedIds.size > 1 && selectedIds.has(fileId)) {
             clearSelection();
             toggleSelection(fileId, true, false);
             return;
        }
    }

    toggleSelection(fileId, isMulti, isRange);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading files...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading files</div>;

  return (
    <div className="flex-1 overflow-y-auto p-1" onClick={(e) => {
        if (e.target === e.currentTarget) {
            clearSelection();
        }
    }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {files.map(file => (
            <FileCard
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                onClick={(e) => handleFileClick(e, file.id)}
            />
        ))}
        </div>
    </div>
  );
};
