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
import { Badge } from '@/components/ui/badge';
import { X, Download, Copy, Calendar, HardDrive, FileText, Image, Video, Music, FileCode } from 'lucide-react';
import { toast } from 'sonner';

interface FilePreviewProps {
  fileId: string;
  fileName: string;
  fileCid: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FilePreview({
  fileId,
  fileName,
  fileCid,
  fileType,
  fileSize,
  uploadDate,
  open,
  onOpenChange,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && fileCid) {
      loadPreview();
    }
  }, [open, fileCid]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取下载链接
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey: fileCid,
        }),
      });

      if (!response.ok) {
        throw new Error('无法获取预览链接');
      }

      const data = await response.json();
      setPreviewUrl(data.downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载预览失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(blobUrl);
      toast.success('文件下载成功');
    } catch (err) {
      toast.error('文件下载失败');
    }
  };

  const handleCopyCID = () => {
    navigator.clipboard.writeText(fileCid);
    toast.success('CID 已复制到剪贴板');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500/70" />;
    }
    if (fileType.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500/70" />;
    }
    if (fileType.startsWith('audio/')) {
      return <Music className="h-5 w-5 text-green-500/70" />;
    }
    if (fileType.includes('pdf') || fileType.includes('document')) {
      return <FileText className="h-5 w-5 text-red-500/70" />;
    }
    if (fileType.includes('code') || fileType.includes('text')) {
      return <FileCode className="h-5 w-5 text-yellow-500/70" />;
    }
    return <FileText className="h-5 w-5 text-gray-500/70" />;
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2" />
            <p>加载中...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <div className="text-center">
            <p className="text-red-500/70 mb-2">{error}</p>
            <Button variant="outline" onClick={loadPreview} className="crystal-card">
              重试
            </Button>
          </div>
        </div>
      );
    }

    if (!previewUrl) {
      return null;
    }

    // 图片预览
    if (fileType.startsWith('image/')) {
      return (
        <img
          src={previewUrl}
          alt={fileName}
          className="max-w-full max-h-96 object-contain rounded-lg"
        />
      );
    }

    // 视频预览
    if (fileType.startsWith('video/')) {
      return (
        <video
          src={previewUrl}
          controls
          className="max-w-full max-h-96 rounded-lg"
        />
      );
    }

    // 音频预览
    if (fileType.startsWith('audio/')) {
      return (
        <audio src={previewUrl} controls className="w-full max-w-md mx-auto" />
      );
    }

    // 其他文件类型显示占位
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mx-auto">
            {getFileIcon()}
          </div>
          <p className="font-medium mb-2">{fileName}</p>
          <p className="text-sm">此文件类型不支持预览</p>
          <p className="text-xs mt-2">请下载文件后查看</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crystal-dialog sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon()}
              <span className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent truncate">
                文件预览
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="truncate">
            {fileName}
          </DialogDescription>
        </DialogHeader>

        {/* 文件信息 */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge className="crystal-badge">
            <HardDrive className="h-3 w-3 mr-1" />
            {formatFileSize(fileSize)}
          </Badge>
          <Badge className="crystal-badge">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(uploadDate)}
          </Badge>
          <Badge className="crystal-badge">
            {fileType || '未知类型'}
          </Badge>
        </div>

        {/* 预览内容 */}
        <div className="flex-1 overflow-auto flex items-center justify-center">
          {renderPreview()}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-4 border-t border-purple-100/30">
          <Button onClick={handleDownload} className="crystal-button text-white flex-1">
            <Download className="mr-2 h-4 w-4" />
            下载文件
          </Button>
          <Button variant="outline" onClick={handleCopyCID} className="crystal-card">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
