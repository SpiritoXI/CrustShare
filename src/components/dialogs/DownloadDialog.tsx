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
import { X, Download, CheckCircle, AlertCircle, Globe, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { getProxy } from '@/lib/proxy';

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
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [gatewayInfo, setGatewayInfo] = useState<{id: string, name: string} | null>(null);

  const handleCopyCID = () => {
    navigator.clipboard.writeText(cid);
    toast.success('CID 已复制到剪贴板');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    setError(null);
    setDownloadUrl('');

    try {
      // 获取下载 URL（通过网关）
      const response = await fetch(`/api/download?fileId=${fileId}&cid=${cid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || '获取下载链接失败');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setGatewayInfo({ id: data.gatewayId, name: `网关 ${data.gatewayId}` });

      // 模拟下载进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        setDownloadProgress(i);
      }

      // 触发浏览器下载
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();

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

  const handleRetry = async () => {
    setIsDownloading(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);
    setError(null);

    try {
      // 尝试切换到备用网关
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          cid,
          fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || '获取下载链接失败');
      }

      const data = await response.json();
      setDownloadUrl(data.downloadUrl);
      setGatewayInfo({ id: data.gatewayId, name: `网关 ${data.gatewayId}` });
      setError(null);

      // 触发浏览器下载
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();

      setDownloadStatus('completed');
      toast.success(data.message || '文件下载成功');
    } catch (err) {
      setError(err instanceof Error ? err.message : '所有网关暂时不可用，请稍后重试');
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
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500/70" />
              <span className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent">
                下载文件
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            通过代理从 CrustFiles.io 下载文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件信息 */}
          <div className="p-4 crystal-card rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-purple-500/70" />
              <span className="font-medium">文件信息</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">文件名：</span>
                <span className="ml-1 font-medium">{fileName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">CID：</span>
                <div className="ml-1 flex items-center gap-2">
                  <code className="text-xs break-all bg-purple-50/60 px-2 py-1 rounded flex-1">
                    {cid}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyCID}
                    className="h-6 w-6 crystal-icon"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
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
                <Button onClick={handleRetry} className="crystal-button text-white">
                  <Zap className="mr-2 h-4 w-4" />
                  切换网关重试
                </Button>
              </>
            )}
            {downloadStatus === 'completed' && (
              <>
                {gatewayInfo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
                    <Zap className="h-3 w-3" />
                    <span>通过 {gatewayInfo.name} 下载</span>
                  </div>
                )}
                <Button onClick={onClose} className="crystal-button text-white">
                  关闭
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
