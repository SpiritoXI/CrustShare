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
import { X, Download, CheckCircle, AlertCircle, RefreshCw, Globe } from 'lucide-react';
import { getBestGateway, getDownloadUrl, Gateway } from '@/lib/gateway';
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
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkGateway();
  }, []);

  const checkGateway = async () => {
    setIsChecking(true);
    try {
      const bestGateway = await getBestGateway();
      if (bestGateway) {
        setGateway(bestGateway);
        toast.success(`已选择最佳网关：${bestGateway.name}`);
      } else {
        setError('无法检测到可用的网关');
        setDownloadStatus('error');
      }
    } catch (err) {
      setError('网关检测失败');
      setDownloadStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!gateway) return;

    setIsDownloading(true);
    setDownloadStatus('downloading');
    setDownloadProgress(0);

    try {
      const url = getDownloadUrl(cid, gateway);

      // 模拟下载进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setDownloadProgress(i);
      }

      // 实际下载
      const response = await fetch(url);
      if (!response.ok) throw new Error('下载失败');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(blobUrl);

      setDownloadStatus('completed');
      toast.success('文件下载成功');
    } catch (err) {
      setError('下载失败，请重试');
      setDownloadStatus('error');
      toast.error('文件下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatResponseTime = (ms?: number): string => {
    if (!ms) return '-';
    return `${ms.toFixed(0)}ms`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="crystal-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              下载文件
            </span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            从 IPFS 网关下载文件
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件信息 */}
          <div className="p-4 crystal-card rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-purple-600" />
              <span className="font-medium">文件信息</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">文件名：</span>
                <span className="ml-1 font-medium">{fileName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">CID：</span>
                <span className="ml-1 font-mono text-xs">{cid}</span>
              </div>
            </div>
          </div>

          {/* 网关信息 */}
          <div className="p-4 crystal-card rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-purple-600" />
                <span className="font-medium">网关信息</span>
              </div>
              {isChecking && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {gateway ? (
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">网关：</span>
                  <span className="ml-1 font-medium">{gateway.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">响应时间：</span>
                  <span className="ml-1 font-medium text-green-600">
                    {formatResponseTime(gateway.responseTime)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  <span className="ml-1 font-medium text-green-600">可用</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isChecking ? '正在检测最佳网关...' : '未检测到可用网关'}
              </p>
            )}
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
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">下载完成</span>
            </div>
          )}

          {downloadStatus === 'error' && (
            <div className="flex items-center justify-center gap-2 p-4 crystal-card rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-red-600">{error || '下载失败'}</span>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            {downloadStatus === 'idle' || downloadStatus === 'error' ? (
              <>
                <Button
                  variant="outline"
                  onClick={checkGateway}
                  disabled={isChecking}
                  className="crystal-card"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  重新检测
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!gateway || isChecking || isDownloading}
                  className="crystal-button text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载
                </Button>
              </>
            ) : (
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
