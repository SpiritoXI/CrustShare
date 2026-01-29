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
import { Badge } from '@/components/ui/badge';
import {
  FileIcon,
  RefreshCw,
  Trash2,
  History,
  FileText,
  Calendar,
} from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

interface VersionHistoryProps {
  fileId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VersionHistory({
  fileId,
  fileName,
  open,
  onOpenChange,
}: VersionHistoryProps) {
  const [comment, setComment] = useState('');

  const versions = useStore((state) => state.getVersions(fileId));
  const file = useStore((state) => state.files.find((f) => f.id === fileId));
  const currentVersion = file?.currentVersion || 1;
  const addVersion = useStore((state) => state.addVersion);
  const restoreVersion = useStore((state) => state.restoreVersion);
  const deleteVersion = useStore((state) => state.deleteVersion);

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

  const handleCreateVersion = () => {
    if (!file || !file.cid) {
      toast.error('无法创建版本：文件未上传完成');
      return;
    }

    const newVersionNumber = Math.max(1, ...(versions.map((v) => v.version) || [])) + 1;

    const newVersion = {
      id: `version-${Date.now()}`,
      version: newVersionNumber,
      size: file.size,
      uploadDate: new Date().toISOString(),
      cid: file.cid,
      comment: comment || `版本 ${newVersionNumber}`,
    };

    addVersion(fileId, newVersion);
    toast.success(`已创建版本 ${newVersionNumber}`);
    setComment('');
  };

  const handleRestoreVersion = (version: number, cid: string, size: number) => {
    if (confirm(`确定要恢复到版本 ${version} 吗？`)) {
      // 重新添加这个版本作为当前版本
      const newVersionNumber = Math.max(1, ...(versions.map((v) => v.version) || [])) + 1;

      const restoredVersion = {
        id: `version-${Date.now()}`,
        version: newVersionNumber,
        size: size,
        uploadDate: new Date().toISOString(),
        cid: cid,
        comment: `从版本 ${version} 恢复`,
      };

      addVersion(fileId, restoredVersion);
      restoreVersion(fileId, newVersionNumber);
      toast.success(`已恢复到版本 ${version}（创建新版本 ${newVersionNumber}）`);
    }
  };

  const handleDeleteVersion = (version: number) => {
    if (version === currentVersion) {
      toast.error('无法删除当前版本');
      return;
    }
    if (versions.length <= 1) {
      toast.error('必须保留至少一个版本');
      return;
    }
    if (confirm(`确定要删除版本 ${version} 吗？此操作不可恢复。`)) {
      deleteVersion(fileId, version);
      toast.success(`已删除版本 ${version}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crystal-dialog sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-500/70" />
            <span className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 bg-clip-text text-transparent">
              版本历史
            </span>
          </DialogTitle>
          <DialogDescription>
            管理 {fileName} 的版本历史
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 创建新版本 */}
          <div className="p-4 crystal-card rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              创建新版本
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="输入版本备注（可选）"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="crystal-input flex-1"
              />
              <Button onClick={handleCreateVersion} className="crystal-button text-white">
                <RefreshCw className="mr-2 h-4 w-4" />
                创建版本
              </Button>
            </div>
          </div>

          {/* 版本列表 */}
          <div className="space-y-2">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>暂无版本历史</p>
                <p className="text-sm mt-1">创建第一个版本以开始跟踪</p>
              </div>
            ) : (
              versions
                .sort((a, b) => b.version - a.version)
                .map((version) => (
                  <div
                    key={version.id}
                    className={`p-4 crystal-card rounded-lg ${
                      version.version === currentVersion
                        ? 'border-purple-300/60 border-2'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              version.version === currentVersion
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              version.version === currentVersion
                                ? 'crystal-badge crystal-badge-primary'
                                : 'crystal-badge'
                            }
                          >
                            版本 {version.version}
                          </Badge>
                          {version.version === currentVersion && (
                            <Badge className="crystal-badge crystal-badge-success">
                              当前版本
                            </Badge>
                          )}
                        </div>

                        {version.comment && (
                          <p className="text-sm font-medium mb-2">{version.comment}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(version.uploadDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {formatFileSize(version.size)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <code className="text-xs bg-purple-50/60 px-2 py-1 rounded">
                            CID: {version.cid}
                          </code>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {version.version !== currentVersion && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRestoreVersion(
                                version.version,
                                version.cid,
                                version.size
                              )
                            }
                            className="crystal-card"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            恢复
                          </Button>
                        )}
                        {versions.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteVersion(version.version)}
                            className="crystal-card text-red-400/80 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
