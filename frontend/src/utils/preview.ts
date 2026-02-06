import type { CategoryPreset, FileItem, MixerConfig, PreviewOperation, TargetRoot } from '../types';

const joinPath = (...parts: string[]) => {
  if (parts.length === 0) return '';
  const [first, ...rest] = parts;
  let result = first || '';
  result = result.replace(/\/+$/g, '');
  for (const part of rest) {
    if (!part) continue;
    const cleaned = part.replace(/^\/+|\/+$/g, '');
    if (!cleaned) continue;
    result = `${result}/${cleaned}`;
  }
  return result || '/';
};

const getBaseName = (name: string) => {
  const idx = name.lastIndexOf('.');
  if (idx === -1) return name;
  return name.slice(0, idx);
};

const getExtension = (name: string) => {
  const idx = name.lastIndexOf('.');
  if (idx === -1 || idx === name.length - 1) return '';
  return name.slice(idx + 1);
};

export const buildPreviewOps = (
  selectedFiles: FileItem[],
  mixerConfig: MixerConfig,
  activePreset: CategoryPreset,
  activeTarget: TargetRoot,
): PreviewOperation[] => {
  const targetDir = joinPath(activeTarget.path, activePreset.targetSubPath);

  return selectedFiles
    .filter(file => !file.isDir)
    .map((file, idx, list) => {
      const nameParts: string[] = [];
      if (mixerConfig.useOriginal) {
        nameParts.push(getBaseName(file.name));
      } else {
        const selectedParts = (
          mixerConfig.selectedOrder && mixerConfig.selectedOrder.length > 0
            ? mixerConfig.selectedOrder
            : [
                ...(mixerConfig.selectedTokens || []),
                ...(mixerConfig.selectedKeywords || []),
              ]
        ).filter(Boolean);
        if (selectedParts.length > 0) {
          const seen = new Set<string>();
          const uniqueParts = selectedParts.filter(part => {
            if (seen.has(part)) return false;
            seen.add(part);
            return true;
          });
          nameParts.push(...uniqueParts);
        } else {
          nameParts.push(activePreset.name.toUpperCase());
        }
      }

      const baseName = nameParts.join('_').replace(/_{2,}/g, '_');
      const finalSuffix = list.length > 1 ? `_${String(idx + 1).padStart(3, '0')}` : '';
      const extension = getExtension(file.name);
      const newName = extension
        ? `${baseName}${finalSuffix}.${extension.toLowerCase()}`
        : `${baseName}${finalSuffix}`;

      const originalPath = file.sourcePath || joinPath(file.path, file.name);
      const newPath = joinPath(targetDir, newName);

      return {
        id: file.id,
        fileId: file.id,
        originalName: file.name,
        newName,
        status: 'pending',
        targetPath: targetDir,
        originalPath,
        newPath,
      };
    });
};

export const getTargetDir = (activePreset: CategoryPreset, activeTarget: TargetRoot) =>
  joinPath(activeTarget.path, activePreset.targetSubPath);
