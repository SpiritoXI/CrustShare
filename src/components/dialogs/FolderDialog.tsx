'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Folder } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

interface FolderDialogProps {
  mode: 'create' | 'rename';
  folderId?: string;
  parentId?: string | null;
  onClose: () => void;
}

export default function FolderDialog({
  mode,
  folderId,
  parentId = null,
  onClose,
}: FolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const folders = useStore((state) => state.folders);
  const addFolder = useStore((state) => state.addFolder);
  const updateFolder = useStore((state) => state.updateFolder);

  const folder = folderId ? folders.find((f) => f.id === folderId) : null;

  useEffect(() => {
    if (folder) {
      setFolderName(folder.name);
    }
  }, [folder]);

  const handleSubmit = () => {
    if (!folderName.trim()) {
      setError('文件夹名称不能为空');
      return;
    }

    // 检查文件夹名称是否已存在
    const nameExists = folders.some(
      (f) =>
        f.name === folderName.trim() &&
        f.parentId === parentId &&
        f.id !== folderId
    );

    if (nameExists) {
      setError('文件夹名称已存在');
      return;
    }

    if (mode === 'create') {
      const newFolder = {
        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: folderName.trim(),
        parentId: parentId || null,
        createdAt: new Date().toISOString(),
      };

      addFolder(newFolder);
      toast.success('文件夹创建成功');
    } else if (mode === 'rename' && folderId) {
      updateFolder(folderId, { name: folderName.trim() });
      toast.success('文件夹重命名成功');
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && folderName.trim()) {
      handleSubmit();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {mode === 'create' ? '新建文件夹' : '重命名文件夹'}
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? '创建一个新的文件夹' : '修改文件夹名称'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">文件夹名称</Label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                className="crystal-input pl-10"
                placeholder="输入文件夹名称"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="crystal-card">
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!folderName.trim() || (mode === 'rename' && folderName === folder?.name)}
              className="crystal-button text-white"
            >
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
