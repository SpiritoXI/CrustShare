"use client";

import { ImageViewer } from "@/components/image-viewer";
import { MediaPlayer } from "@/components/media-player";
import { isImageFile, isMediaFile } from "@/lib/utils";
import type { FileRecord, Gateway } from "@/types";

interface PreviewModalProps {
  file: FileRecord | null;
  isOpen: boolean;
  gateways: Gateway[];
  onClose: () => void;
}

export function PreviewModal({ file, isOpen, gateways, onClose }: PreviewModalProps) {
  if (!isOpen || !file) return null;

  if (isImageFile(file.name)) {
    return (
      <ImageViewer
        cid={file.cid}
        filename={file.name}
        gateways={gateways}
        onClose={onClose}
      />
    );
  }

  if (isMediaFile(file.name)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="w-full max-w-5xl mx-4 relative">
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          >
            关闭
          </button>
          <MediaPlayer cid={file.cid} filename={file.name} gateways={gateways} />
        </div>
      </div>
    );
  }

  return null;
}
