/**
 * 文件操作 Hook
 * 处理文件的增删改查操作
 */

"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { useFileStore, useUIStore } from "@/lib/store";
import { handleError } from "@/lib/utils/error";
import type { FileRecord } from "@/types";

export interface FileOperations {
  handleDelete: (fileId: string | number) => Promise<void>;
  handleBatchDelete: (fileIds: string[]) => Promise<void>;
  handleRename: (fileId: string | number, newName: string) => Promise<void>;
  handleCopyCID: (cid: string, fileId: string | number) => void;
  handleShare: (file: FileRecord) => void;
  handleDownload: (file: FileRecord) => Promise<void>;
  handlePreview: (file: FileRecord) => void;
  handleMove: (fileId: string | number, targetFolderId: string | null) => Promise<void>;
  handleBatchMove: (fileIds: string[], targetFolderId: string | null) => Promise<void>;
  handleBatchCopy: (fileIds: string[], targetFolderId: string | null) => Promise<void>;
}

export interface FileOperationsState {
  copiedId: string | number | null;
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
}

export function useFileOperations(
  onShareModalOpen: (file: FileRecord) => void,
  onDownloadModalOpen: (file: FileRecord) => void,
  onPreviewOpen: (file: FileRecord) => void
): FileOperations & FileOperationsState {
  const { files, setFiles, selectedFiles, setSelectedFiles } = useFileStore();
  const { showToast } = useUIStore();

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, [setSelectedFiles]);

  const handleDelete = useCallback(
    async (fileId: string | number) => {
      try {
        await api.deleteFile(fileId.toString());
        setFiles((prev) => prev.filter((f) => String(f.id) !== String(fileId)));
        showToast("文件已删除", "success");
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFiles, showToast]
  );

  const handleBatchDelete = useCallback(
    async (fileIds: string[]) => {
      if (fileIds.length === 0) return;

      try {
        const deletedCount = await api.deleteFiles(fileIds);
        setFiles((prev) => prev.filter((f) => !fileIds.includes(String(f.id))));
        showToast(`已删除 ${deletedCount} 个文件`, "success");
        clearSelection();
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFiles, showToast, clearSelection]
  );

  const handleRename = useCallback(
    async (fileId: string | number, newName: string) => {
      try {
        await api.renameFile(fileId, newName);
        setFiles((prev) =>
          prev.map((f) => (String(f.id) === String(fileId) ? { ...f, name: newName } : f))
        );
        showToast("文件重命名成功", "success");
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFiles, showToast]
  );

  const handleCopyCID = useCallback(
    async (cid: string, _fileId: string | number) => {
      try {
        await navigator.clipboard.writeText(cid);
        showToast("CID 已复制", "success");
      } catch {
        showToast("复制失败", "error");
      }
    },
    [showToast]
  );

  const handleShare = useCallback(
    (file: FileRecord) => {
      onShareModalOpen(file);
    },
    [onShareModalOpen]
  );

  const handleDownload = useCallback(
    async (file: FileRecord) => {
      onDownloadModalOpen(file);
    },
    [onDownloadModalOpen]
  );

  const handlePreview = useCallback(
    (file: FileRecord) => {
      onPreviewOpen(file);
    },
    [onPreviewOpen]
  );

  const handleMove = useCallback(
    async (fileId: string | number, targetFolderId: string | null) => {
      try {
        await api.moveFiles([fileId], targetFolderId || "default");
        setFiles((prev) =>
          prev.map((f) =>
            String(f.id) === String(fileId) ? { ...f, folder_id: targetFolderId || "default" } : f
          )
        );
        showToast("文件移动成功", "success");
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFiles, showToast]
  );

  const handleBatchMove = useCallback(
    async (fileIds: string[], targetFolderId: string | null) => {
      if (fileIds.length === 0) return;

      try {
        const movedCount = await api.moveFiles(fileIds, targetFolderId || "default");
        setFiles((prev) =>
          prev.map((f) =>
            fileIds.includes(String(f.id))
              ? { ...f, folder_id: targetFolderId || "default" }
              : f
          )
        );
        showToast(`已移动 ${movedCount} 个文件`, "success");
        clearSelection();
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFiles, showToast, clearSelection]
  );

  const handleBatchCopy = useCallback(
    async (fileIds: string[], targetFolderId: string | null) => {
      if (fileIds.length === 0) return;

      try {
        const copiedCount = await api.copyFiles(fileIds, targetFolderId || "default");
        const updatedFiles = await api.loadFiles();
        setFiles(updatedFiles);
        showToast(`已复制 ${copiedCount} 个文件`, "success");
        clearSelection();
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFiles, showToast, clearSelection]
  );

  const toggleFileSelection = useCallback(
    (fileId: string) => {
      setSelectedFiles((prev: string[]) =>
        prev.includes(fileId)
          ? prev.filter((id: string) => id !== fileId)
          : [...prev, fileId]
      );
    },
    [setSelectedFiles]
  );

  const selectAllFiles = useCallback(() => {
    const allFileIds = files.map((f) => String(f.id));
    setSelectedFiles(allFileIds);
  }, [files, setSelectedFiles]);

  return {
    handleDelete,
    handleBatchDelete,
    handleRename,
    handleCopyCID,
    handleShare,
    handleDownload,
    handlePreview,
    handleMove,
    handleBatchMove,
    handleBatchCopy,
    copiedId: null,
    selectedFiles,
    setSelectedFiles,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
  };
}
