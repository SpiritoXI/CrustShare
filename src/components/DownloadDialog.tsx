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
import { X, Download, CheckCircle, AlertCircle, RefreshCw, CloudDownload } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadDialogProps {
  fileId: string;
  fileName: string;
  cid: string;
  onClose: () => void;
}

export default function DownloadDialog({
  fileId,
  fileName,
  cid,
  onClose,
}: DownloadDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    setError(null);

    try {
      // 调用下载 API 生成签名 URL
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey: cid, // 使用 cid 作为 fileKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成下载链接失败');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);

      // 模拟下载进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setDownloadProgress(i);
      }

      // 使用 fetch + blob 模式下载
      const fileResponse = await fetch(data.downloadUrl);
      if (!fileResponse.ok) throw new Error('下载失败');

      const blob = await fileResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(blobUrl);

      setDownloadStatus('completed');
      toast.success('文件下载成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载失败，请重试');
      setDownloadStatus('error');
      toast.error('文件下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent">
              下载文件
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            从对象存储下载文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件信息 */}
          <div className="p-4 crystal-card rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CloudDownload className="h-4 w-4 text-purple-500/70" />
              <span className="font-medium">文件信息</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">文件名：</span>
                <span className="ml-1 font-medium">{fileName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">文件 Key：</span>
                <span className="ml-1 font-mono text-xs break-all">{cid}</span>
              </div>
            </div>
          </div>

          {/* 下载进度 */}
          {downloadStatus === 'downloading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">下载进度</span>
                <span className="font-medium">{downloadProgress}%</span>
              </div>
              <div className="crystal-progress h-2">
                <div className="crystal-progress-bar" style={{ width: `${downloadProgress}%` }} />
              </div>
            </div>
          )}

          {/* 下载状态 */}
          {downloadStatus === 'completed' && (
            <div className="flex items-center justify-center gap-2 p-4 crystal-card rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500/70" />
              <span className="text-sm font-medium">下载完成</span>
            </div>
          )}

          {downloadStatus === 'error' && (
            <div className="flex items-center justify-center gap-2 p-4 crystal-card rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400/70" />
              <span className="text-sm text-red-500/80">{error}</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            {downloadStatus === 'idle' && (
              <Button onClick={handleDownload} className="crystal-button text-white">
                <Download className="mr-2 h-4 w-4" />
                开始下载
              </Button>
            )}
            {downloadStatus === 'error' && (
              <>
                <Button variant="outline" onClick={onClose} className="crystal-card">
                  关闭
                </Button>
                <Button onClick={handleDownload} className="crystal-button text-white">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </>
            )}
            {downloadStatus === 'completed' && (
              <Button onClick={onClose} className="crystal-button text-white">
                关闭
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
