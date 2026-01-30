/**
 * 文件夹操作 Hook
 * 处理文件夹的增删改查操作
 */

"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useFileStore, useUIStore } from "@/lib/store";
import { handleError } from "@/lib/error-handler";
import type { Folder } from "@/types";

export interface FolderOperations {
  handleCreateFolder: (name: string, parentId?: string | null) => Promise<Folder | null>;
  handleRenameFolder: (folderId: string, newName: string) => Promise<void>;
  handleDeleteFolder: (folderId: string) => Promise<void>;
  handleNavigateToFolder: (folderId: string | null) => void;
}

export interface FolderOperationsState {
  folders: Folder[];
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  isLoading: boolean;
}

export function useFolderOperations(): FolderOperations & FolderOperationsState {
  const { folders, setFolders, selectedFolder, setSelectedFolder } = useFileStore();
  const { showToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  // 创建文件夹
  const handleCreateFolder = useCallback(
    async (name: string, parentId: string | null = null): Promise<Folder | null> => {
      try {
        setIsLoading(true);
        const folder = await api.createFolder(name, parentId);
        setFolders((prev) => [...prev, folder]);
        showToast("文件夹创建成功", "success");
        return folder;
      } catch (error) {
        handleError(error, { showToast });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setFolders, showToast]
  );

  // 重命名文件夹
  const handleRenameFolder = useCallback(
    async (folderId: string, newName: string) => {
      try {
        await api.renameFolder(folderId, newName);
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
        );
        showToast("文件夹重命名成功", "success");
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFolders, showToast]
  );

  // 删除文件夹
  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await api.deleteFolder(folderId);
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        
        // 如果当前在删除的文件夹中，导航到根目录
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
        }
        
        showToast("文件夹已删除", "success");
      } catch (error) {
        handleError(error, { showToast });
      }
    },
    [setFolders, selectedFolder, setSelectedFolder, showToast]
  );

  // 导航到文件夹
  const handleNavigateToFolder = useCallback(
    (folderId: string | null) => {
      setSelectedFolder(folderId);
    },
    [setSelectedFolder]
  );

  return {
    // 操作函数
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleNavigateToFolder,
    // 状态
    folders,
    currentFolderId: selectedFolder,
    setCurrentFolderId: setSelectedFolder,
    isLoading,
  };
}
