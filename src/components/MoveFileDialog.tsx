'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Folder, FolderOpen, ChevronRight, ChevronDown, Search } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import { Folder as FolderType } from '@/store/useStore';

interface MoveFileDialogProps {
  fileIds: string[];
  onClose: () => void;
}

export default function MoveFileDialog({ fileIds, onClose }: MoveFileDialogProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const folders = useStore((state) => state.folders);
  const files = useStore((state) => state.files);
  const updateFile = useStore((state) => state.updateFile);

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

  const handleMove = async () => {
    setIsMoving(true);

    // 模拟移动延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    fileIds.forEach((fileId) => {
      updateFile(fileId, { folderId: selectedFolderId });
    });

    toast.success(`已移动 ${fileIds.length} 个文件`);
    setIsMoving(false);
    onClose();
  };

  const filteredFolders = searchTerm
    ? folders.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : folders;

  const renderFolder = (folder: FolderType, level: number = 0) => {
    if (searchTerm && !folder.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

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
            onClick={() => setSelectedFolderId(folder.id)}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-purple-600" />
            ) : (
              <Folder className="h-4 w-4 text-purple-600" />
            )}
          </Button>

          <span className="flex-1 text-sm truncate">{folder.name}</span>
        </div>

        {isExpanded &&
          subfolders.map((subfolder) => renderFolder(subfolder, level + 1))}
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              移动文件
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            选择目标文件夹
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索文件夹..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crystal-input pl-10"
            />
          </div>

          {/* 文件夹列表 */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto border rounded-lg p-2">
            {/* 根文件夹 */}
            <div
              className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-colors ${
                selectedFolderId === null ? 'bg-purple-100/60' : 'hover:bg-purple-50/40'
              }`}
              onClick={() => setSelectedFolderId(null)}
            >
              <div className="h-5 w-5" />
              <Folder className="h-4 w-4 text-purple-600" />
              <span className="flex-1 text-sm">根目录</span>
            </div>

            {/* 文件夹树 */}
            {!searchTerm &&
              getSubfolders(null).map((folder) => renderFolder(folder))}

            {searchTerm &&
              filteredFolders.map((folder) => renderFolder(folder))}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isMoving}
              className="crystal-card"
            >
              取消
            </Button>
            <Button
              onClick={handleMove}
              disabled={isMoving}
              className="crystal-button text-white"
            >
              {isMoving ? '移动中...' : '移动'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
