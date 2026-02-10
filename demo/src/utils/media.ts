const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tiff',
  'tif',
  'heic',
  'avif',
]);

const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'mov',
  'm4v',
  'mkv',
  'avi',
  'webm',
  'wmv',
  'flv',
  'mpg',
  'mpeg',
  '3gp',
  '3g2',
  'mts',
  'm2ts',
  'vob',
  'hevc',
  'h265',
  'h264',
]);

const getExtension = (name: string): string => {
  const idx = name.lastIndexOf('.');
  if (idx === -1 || idx === name.length - 1) return '';
  return name.slice(idx + 1).toLowerCase();
};

export const isImageFileName = (name: string): boolean => {
  const ext = getExtension(name);
  if (!ext) return false;
  return IMAGE_EXTENSIONS.has(ext);
};

export const isVideoFileName = (name: string): boolean => {
  const ext = getExtension(name);
  if (!ext) return false;
  return VIDEO_EXTENSIONS.has(ext);
};

export const isMediaFileName = (name: string): boolean => isImageFileName(name) || isVideoFileName(name);
