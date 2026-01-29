'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Folder, FolderOpen, ChevronRight, ChevronDown, MoreVertical, Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import FolderDialog from './dialogs/FolderDialog';
import { Folder as FolderType } from '@/store/useStore';

export default function FolderTree() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const folders = useStore((state) => state.folders);
  const currentFolderId = useStore((state) => state.currentFolderId);
  const setCurrentFolder = useStore((state) => state.setCurrentFolder);
  const deleteFolder = useStore((state) => state.deleteFolder);

  useEffect(() => {
    setSelectedFolderId(currentFolderId);
  }, [currentFolderId]);

  const getSubfolders = (parentId: string | null): FolderType[] => {
    return folders.filter((f) => f.parentId === parentId);
  };

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleFolderClick = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setCurrentFolder(folderId);
  };

  const handleCreateFolder = (parentId: string | null) => {
    setCreateParentId(parentId);
    setShowCreateDialog(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    // 检查文件夹是否包含文件
    const files = useStore.getState().files;
    const hasFiles = files.some((f) => f.folderId === folderId);

    if (hasFiles) {
      toast.error('文件夹不为空，请先移动或删除文件');
      return;
    }

    // 检查是否包含子文件夹
    const hasSubfolders = folders.some((f) => f.parentId === folderId);

    if (hasSubfolders) {
      toast.error('文件夹包含子文件夹，请先删除子文件夹');
      return;
    }

    deleteFolder(folderId);
    toast.success('文件夹已删除');
  };

  const renderFolder = (folder: FolderType, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const subfolders = getSubfolders(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors ${
            isSelected ? 'bg-purple-100/60' : 'hover:bg-purple-50/40'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              if (subfolders.length > 0) {
                toggleExpand(folder.id);
              }
            }}
          >
            {subfolders.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              if (subfolders.length > 0) {
                toggleExpand(folder.id);
              }
              handleFolderClick(folder.id);
            }}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-purple-600" />
            ) : (
              <Folder className="h-4 w-4 text-purple-600" />
            )}
          </Button>

          <span
            className="flex-1 text-sm truncate cursor-pointer"
            onClick={() => handleFolderClick(folder.id)}
          >
            {folder.name}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="crystal-dialog">
              <DropdownMenuItem
                onClick={() => handleCreateFolder(folder.id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                新建子文件夹
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenameFolderId(folder.id)}>
                <Edit2 className="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteFolder(folder.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded &&
          subfolders.map((subfolder) => renderFolder(subfolder, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">文件夹</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => handleCreateFolder(null)}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {/* 根文件夹 */}
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-colors ${
            selectedFolderId === null ? 'bg-purple-100/60' : 'hover:bg-purple-50/40'
          }`}
          onClick={() => handleFolderClick(null)}
        >
          <div className="h-5 w-5" />
          <Folder className="h-4 w-4 text-purple-600" />
          <span className="flex-1 text-sm">全部文件</span>
        </div>

        {/* 文件夹树 */}
        {getSubfolders(null).map((folder) => renderFolder(folder))}
      </div>

      {showCreateDialog && (
        <FolderDialog
          mode="create"
          parentId={createParentId}
          onClose={() => {
            setShowCreateDialog(false);
            setCreateParentId(null);
          }}
        />
      )}

      {renameFolderId && (
        <FolderDialog
          mode="rename"
          folderId={renameFolderId}
          onClose={() => setRenameFolderId(null)}
        />
      )}
    </div>
  );
}
