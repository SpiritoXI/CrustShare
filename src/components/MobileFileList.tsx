'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileIcon, MoreVertical, CheckCircle, AlertCircle, Clock, Copy, Edit2, Trash2, Share2, Download, History, Shield } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import RenameDialog from './RenameDialog';
import ShareDialog from './ShareDialog';
import DownloadDialog from './DownloadDialog';
import VersionHistory from './VersionHistory';

interface FileListProps {
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    uploadDate: string;
    cid?: string;
    status: 'uploading' | 'completed' | 'error';
    progress?: number;
  }>;
}

export default function MobileFileList({ files }: FileListProps) {
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [downloadFile, setDownloadFile] = useState<{ id: string; name: string; cid: string } | null>(null);
  const [versionFile, setVersionFile] = useState<{ id: string; name: string } | null>(null);

  const deleteFile = useStore((state) => state.deleteFile);
  const updateFile = useStore((state) => state.updateFile);
  const selectedFiles = useStore((state) => state.selectedFiles);
  const toggleFileSelection = useStore((state) => state.toggleFileSelection);
  const clearSelection = useStore((state) => state.clearSelection);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const handleCopyCID = (cid: string) => {
    navigator.clipboard.writeText(cid);
    toast.success('CID 已复制到剪贴板');
  };

  const handleDelete = (fileId: string) => {
    deleteFile(fileId);
    toast.success('文件记录已删除');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500/70" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400/70" />;
      case 'uploading':
        return <Clock className="h-4 w-4 text-yellow-500/70" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, progress?: number) => {
    switch (status) {
      case 'completed':
        return <Badge className="crystal-badge crystal-badge-success">已完成</Badge>;
      case 'error':
        return <Badge className="crystal-badge crystal-badge-danger">失败</Badge>;
      case 'uploading':
        return <Badge className="crystal-badge crystal-badge-warning">{progress}%</Badge>;
      default:
        return <Badge className="crystal-badge">未知</Badge>;
    }
  };

  if (files.length === 0) {
    return (
      <Card className="crystal-card p-8 text-center">
        <FileIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无文件</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.id} className="crystal-card p-4">
            <div className="flex items-start gap-3">
              {/* 文件图标和复选框 */}
              <div className="flex flex-col items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="rounded"
                />
                <FileIcon className="h-6 w-6 text-purple-500/70" />
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-medium truncate flex-1">{file.name}</p>
                  {getStatusIcon(file.status)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.uploadDate)}</span>
                </div>
                <div className="mt-2">
                  {getStatusBadge(file.status, file.progress)}
                </div>
              </div>

              {/* 操作菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 crystal-icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="crystal-dialog">
                  <DropdownMenuItem
                    onClick={() => setDownloadFile({ id: file.id, name: file.name, cid: file.cid! })}
                    disabled={!file.cid}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCopyCID(file.cid!)}
                    disabled={!file.cid}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制 CID
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShareFileId(file.id)}
                    disabled={!file.cid}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    分享
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setVersionFile({ id: file.id, name: file.name })}
                    disabled={!file.cid}
                  >
                    <History className="mr-2 h-4 w-4" />
                    版本
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenameFileId(file.id)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(file.id)}
                    className="text-red-500/80"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {renameFileId && (
        <RenameDialog
          fileId={renameFileId}
          onClose={() => setRenameFileId(null)}
        />
      )}

      {shareFileId && (
        <ShareDialog
          fileId={shareFileId}
          onClose={() => setShareFileId(null)}
        />
      )}

      {downloadFile && (
        <DownloadDialog
          fileId={downloadFile.id}
          fileName={downloadFile.name}
          cid={downloadFile.cid}
          onClose={() => setDownloadFile(null)}
        />
      )}

      {versionFile && (
        <VersionHistory
          fileId={versionFile.id}
          fileName={versionFile.name}
          open={!!versionFile}
          onOpenChange={(open) => !open && setVersionFile(null)}
        />
      )}
    </>
  );
}
