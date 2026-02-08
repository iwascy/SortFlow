export const isMediaFileName = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase();
  return [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp', 'tiff', // Images
    'mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp', // Videos
    'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma' // Audio
  ].includes(ext || '');
};

export const isImageFileName = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic', 'bmp', 'tiff'].includes(ext || '');
};

export const isVideoFileName = (name: string): boolean => {
  const ext = name.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp'].includes(ext || '');
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
