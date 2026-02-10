import React, { useEffect, useRef } from 'react';
import type { FileItem } from '../../types';
import { isVideoFileName } from '../../utils/media';
import { fileService } from '../../services/fileService';

interface MediaPreviewOverlayProps {
  file: FileItem | null;
  onClose: () => void;
}

export const MediaPreviewOverlay: React.FC<MediaPreviewOverlayProps> = ({ file, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') {
        event.preventDefault();
        if (event.key === 'Escape') {
          onClose();
          return;
        }

        const video = videoRef.current;
        if (!video) {
          return;
        }

        if (video.paused) {
          void video.play();
        } else {
          video.pause();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [file, onClose]);

  if (!file || !file.sourcePath) {
    return null;
  }

  const isVideo = isVideoFileName(file.name);
  const src = fileService.getFileContentUrl(file.sourcePath);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md" onClick={onClose} role="presentation">
      <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
        {isVideo ? (
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-2xl shadow-2xl pointer-events-auto"
            onClick={(event) => {
              event.stopPropagation();
              const video = videoRef.current;
              if (!video) return;
              if (video.paused) {
                void video.play();
              } else {
                video.pause();
              }
            }}
          />
        ) : (
          <img
            src={src}
            alt={file.alt || file.name}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl pointer-events-auto"
            onClick={(event) => event.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
};
