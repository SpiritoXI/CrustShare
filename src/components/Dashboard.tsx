'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search, RefreshCw, Plus, LogOut, FileIcon, Tag as TagIcon, Globe, Menu } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import FileList from './FileList';
import AddCidDialog from './DialogAddCid';
import StorageStats from './StorageStats';
import FolderTree from './FolderTree';
import TagManager from './TagManager';
import MoveFileDialog from './DialogMove';
import MobileNav from './MobileNav';

// Vercel 免费层的请求体大小限制（4.5MB）
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [showAddCid, setShowAddCid] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = useStore((state) => state.files);
  const currentFolderId = useStore((state) => state.currentFolderId);
  const searchTerm = useStore((state) => state.searchTerm);
  const selectedFiles = useStore((state) => state.selectedFiles);
  const setSearchTerm = useStore((state) => state.setSearchTerm);
  const setIsAuthenticated = useStore((state) => state.setIsAuthenticated);
  const clearSelection = useStore((state) => state.clearSelection);
  const deleteFile = useStore((state) => state.deleteFile);

  const handleBatchDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedFiles.length} 个文件吗？`)) {
      selectedFiles.forEach((fileId) => deleteFile(fileId));
      clearSelection();
      toast.success(`已删除 ${selectedFiles.length} 个文件`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('crustshare_auth');
    toast.success('已退出登录');
  };

  // 根据当前文件夹和搜索词过滤文件
  const filteredFiles = files.filter((file) => {
    const matchesFolder = currentFolderId === null || file.folderId === currentFolderId;
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];

      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
        toast.error(
          `文件 "${file.name}" 超过大小限制（${maxSizeMB}MB），当前大小：${formatFileSize(file.size)}`
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
        toast.error(
          `文件 "${file.name}" 超过大小限制（${maxSizeMB}MB），当前大小：${formatFileSize(file.size)}`
        );
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRefresh = () => {
    toast.success('文件列表已刷新');
  };

  return (
    <div className="min-h-screen">
      {/* 淡雅背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMDUpIi8+PC9zdmc+')] opacity-20" />
      <div className="absolute -top-60 -right-60 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-purple-500/80 via-pink-500/70 to-blue-500/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                CrustShare
              </h1>
              <p className="text-muted-foreground mt-1">安全的分布式文件存储平台</p>
            </div>
            <div className="flex gap-2">
              <MobileNav />
              <Button variant="outline" size="icon" onClick={handleRefresh} className="crystal-card hidden md:flex">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout} className="crystal-card hidden md:flex">
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            </div>
          </div>
        </div>

        {/* 存储统计 */}
        <StorageStats />

        {/* 主内容区域 */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* 左侧边栏 */}
          <div className="md:col-span-1 space-y-4 hidden md:block">
            {/* 文件夹树 */}
            <Card className="crystal-card">
              <CardHeader>
                <CardTitle className="text-base">文件夹</CardTitle>
              </CardHeader>
              <CardContent>
                <FolderTree />
              </CardContent>
            </Card>

            {/* 标签管理 */}
            <Card className="crystal-card">
              <CardHeader>
                <CardTitle className="text-base">标签</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowTagManager(true)}
                  className="w-full crystal-button text-white"
                >
                  <TagIcon className="mr-2 h-4 w-4" />
                  管理标签
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 右侧主内容 */}
          <div className="md:col-span-3 space-y-4">
            {/* 批量操作工具栏 */}
            {selectedFiles.length > 0 && (
              <Card className="crystal-card border-purple-200/60 border-2">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        已选择 <span className="font-bold">{selectedFiles.length}</span> 个文件
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                      >
                        清除选择
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMoveDialog(true)}
                        className="crystal-card"
                      >
                        移动到文件夹
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTagManager(true)}
                        className="crystal-card"
                      >
                        添加标签
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBatchDelete}
                        className="crystal-card text-red-500 hover:text-red-600"
                      >
                        批量删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 操作区域 */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* 搜索框 */}
              <Card className="crystal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">搜索文件</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="搜索文件名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="crystal-input pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 上传和添加 CID */}
              <Card className="crystal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">文件操作</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button onClick={handleUploadClick} className="crystal-button flex-1 text-white">
                      <Upload className="mr-2 h-4 w-4" />
                      上传文件
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddCid(true)} className="crystal-card">
                      <Plus className="mr-2 h-4 w-4" />
                      添加 CID
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 文件列表 */}
            <Card
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`crystal-card transition-all ${isDragging ? 'border-purple-400 border-2' : ''}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>文件列表</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {filteredFiles.length} 个文件
                  </span>
                </CardTitle>
                <CardDescription>
                  {isDragging ? '松开鼠标以上传文件' : '拖拽文件到此处或点击上传按钮'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <FileIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      暂无文件
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      开始上传文件或添加 CID 来使用 CrustShare 存储服务
                    </p>
                  </div>
                ) : (
                  <FileList files={filteredFiles} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 文件上传对话框 */}
      {selectedFile && (
        <FileUpload
          file={selectedFile}
          onClose={() => {
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
        />
      )}

      {/* 添加 CID 对话框 */}
      {showAddCid && (
        <AddCidDialog onClose={() => setShowAddCid(false)} />
      )}

      {/* 标签管理对话框 */}
      {showTagManager && (
        <TagManager onClose={() => setShowTagManager(false)} />
      )}

      {/* 移动文件对话框 */}
      {showMoveDialog && (
        <MoveFileDialog
          fileIds={selectedFiles}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </div>
  );
}
