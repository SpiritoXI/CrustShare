'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileIcon, MoreVertical, CheckCircle, AlertCircle, Clock, Copy, Edit2, Trash2, Share2, Download } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import RenameDialog from './RenameDialog';
import ShareDialog from './ShareDialog';
import DownloadDialog from './DownloadDialog';

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

export default function FileList({ files }: FileListProps) {
  const [renameFileId, setRenameFileId] = useState<string | null>(null);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [downloadFile, setDownloadFile] = useState<{ id: string; name: string; cid: string } | null>(null);

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
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyCID = (cid: string) => {
    navigator.clipboard.writeText(cid);
    toast.success('CID 已复制到剪贴板');
  };

  const handleDelete = (fileId: string) => {
    deleteFile(fileId);
    toast.success('文件记录已删除');
  };

  const getStatusIcon = (status: string, progress?: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, progress?: number) => {
    switch (status) {
      case 'completed':
        return <Badge className="crystal-badge crystal-badge-success">已完成</Badge>;
      case 'error':
        return <Badge className="crystal-badge crystal-badge-danger">上传失败</Badge>;
      case 'uploading':
        return <Badge className="crystal-badge crystal-badge-warning">上传中 {progress}%</Badge>;
      default:
        return <Badge className="crystal-badge">未知</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-lg overflow-hidden crystal-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-purple-200/30">
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                checked={files.length > 0 && selectedFiles.length === files.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    files.forEach((f) => toggleFileSelection(f.id));
                  } else {
                    clearSelection();
                  }
                }}
                className="rounded"
              />
            </TableHead>
            <TableHead>文件名</TableHead>
            <TableHead className="hidden sm:table-cell">大小</TableHead>
            <TableHead className="hidden md:table-cell">上传日期</TableHead>
            <TableHead className="hidden md:table-cell">CID</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id} className="crystal-table-row border-b border-purple-100/30">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="rounded"
                />
              </TableCell>
              <TableCell>
                <FileIcon className="h-4 w-4 text-purple-600 crystal-icon inline mr-2" />
                <span className="font-medium max-w-[150px] inline align-middle truncate">
                  {file.name}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{formatFileSize(file.size)}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {formatDate(file.uploadDate)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {file.cid ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs crystal-badge bg-purple-500/10 px-2 py-1 rounded max-w-[100px] truncate">
                      {file.cid}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 crystal-icon"
                      onClick={() => handleCopyCID(file.cid!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(file.status, file.progress)}</TableCell>
              <TableCell>
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
                      分享文件
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRenameFileId(file.id)}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
  </>
  );
}
