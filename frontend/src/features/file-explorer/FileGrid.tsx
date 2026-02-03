import { useQuery } from '@tanstack/react-query';
import { fileService } from '../../services/fileService';
import { useAppStore } from '../../store/useAppStore';
import { useEffect } from 'react';
import { FileCard } from './FileCard';
import { useFileSelection } from '../../hooks/useFileSelection';

export const FileGrid = () => {
  const { setFiles, files, currentPath } = useAppStore();
  const { selectedIds, handleSelection, clearSelection } = useFileSelection();

  const { data, isLoading, error } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => fileService.listFiles(currentPath),
  });

  useEffect(() => {
    if (data?.files) {
      setFiles(data.files);
    }
  }, [data, setFiles]);

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
                onClick={(e) => handleSelection(file.id, e)}
            />
        ))}
        </div>
    </div>
  );
};
