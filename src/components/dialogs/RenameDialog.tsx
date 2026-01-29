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
import { X } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

interface RenameDialogProps {
  fileId: string;
  onClose: () => void;
}

export default function RenameDialog({ fileId, onClose }: RenameDialogProps) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const files = useStore((state) => state.files);
  const updateFile = useStore((state) => state.updateFile);

  const file = files.find((f) => f.id === fileId);

  useEffect(() => {
    if (file) {
      setNewName(file.name);
    }
  }, [file]);

  const handleRename = () => {
    if (!newName.trim()) {
      setError('文件名不能为空');
      return;
    }

    // 检查文件名是否已存在（排除当前文件）
    const nameExists = files.some(
      (f) => f.name === newName.trim() && f.id !== fileId
    );

    if (nameExists) {
      setError('文件名已存在');
      return;
    }

    updateFile(fileId, { name: newName.trim() });
    toast.success('文件重命名成功');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && newName.trim()) {
      handleRename();
    }
  };

  if (!file) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              重命名文件
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            修改文件名称
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-name">文件名</Label>
            <Input
              id="file-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="crystal-input"
              placeholder="输入新的文件名"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="crystal-card">
              取消
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newName.trim() || newName === file.name}
              className="crystal-button text-white"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
