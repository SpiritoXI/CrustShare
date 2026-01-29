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
import { Progress } from '@/components/ui/progress';
import { FileIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

interface FileUploadProps {
  file: File;
  onClose: () => void;
}

export default function FileUpload({ file, onClose }: FileUploadProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'completed' | 'error'>('uploading');
  const [error, setError] = useState<string | null>(null);

  const addFile = useStore((state) => state.addFile);
  const updateFile = useStore((state) => state.updateFile);
  const fileExists = useStore((state) => state.fileExists);

  useEffect(() => {
    const uploadFile = async () => {
      // 检查文件是否已存在
      if (fileExists(file.name)) {
        toast.error(`文件 "${file.name}" 已存在，请先删除或重命名`);
        setStatus('error');
        setError('文件已存在');
        return;
      }

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 添加文件到列表（上传中状态）
      addFile({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        status: 'uploading',
        progress: 0,
      });

      try {
        // 创建 FormData
        const formData = new FormData();
        formData.append('file', file);

        // 模拟进度更新
        let progress = 0;
        const progressInterval = setInterval(() => {
          if (progress < 90) {
            progress += Math.random() * 10;
            updateFile(fileId, { progress: Math.min(progress, 90) });
          }
        }, 200);

        // 调用上传 API
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '上传失败');
        }

        const data = await response.json();

        // 上传完成
        setStatus('completed');
        updateFile(fileId, {
          status: 'completed',
          progress: 100,
          cid: data.fileKey, // 使用 fileKey 作为 CID
        });

        toast.success(`${file.name} 上传成功`);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : '上传失败，请重试');
        updateFile(fileId, {
          status: 'error',
        });
        toast.error(`${file.name} 上传失败`);
      }
    };

    uploadFile();
  }, [file, addFile, updateFile, fileExists]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent">
              文件上传
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {status === 'uploading' ? '正在上传文件，请稍候...' : null}
            {status === 'completed' ? '文件上传成功！' : null}
            {status === 'error' ? error : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件信息 */}
          <div className="flex items-start space-x-4 p-4 crystal-card rounded-lg">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20">
                <FileIcon className="h-6 w-6 text-purple-500/80" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFileSize(file.size)}
              </p>
            </div>
            {status === 'completed' && (
              <CheckCircle className="h-6 w-6 text-green-500/70 flex-shrink-0" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-6 w-6 text-red-400/70 flex-shrink-0" />
            )}
          </div>

          {/* 上传进度 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">上传进度</span>
              <span className="font-medium bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent">
                {progress}%
              </span>
            </div>
            <div className="crystal-progress h-2">
              <div className="crystal-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            {status === 'completed' && (
              <Button onClick={onClose} className="crystal-button text-white">关闭</Button>
            )}
            {status === 'error' && (
              <>
                <Button variant="outline" onClick={onClose} className="crystal-card">关闭</Button>
                <Button onClick={onClose} className="crystal-button text-white">重试</Button>
              </>
            )}
            {status === 'uploading' && (
              <Button variant="outline" onClick={onClose} className="crystal-card">取消</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
