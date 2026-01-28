'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search, RefreshCw, Plus, LogOut, FileIcon } from 'lucide-react';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import FileList from './FileList';
import AddCidDialog from './AddCidDialog';
import StorageStats from './StorageStats';

export default function Dashboard() {
  const [isDragging, setIsDragging] = useState(false);
  const [showAddCid, setShowAddCid] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const files = useStore((state) => state.files);
  const searchTerm = useStore((state) => state.searchTerm);
  const setSearchTerm = useStore((state) => state.setSearchTerm);
  const setIsAuthenticated = useStore((state) => state.setIsAuthenticated);
  const clearSelection = useStore((state) => state.clearSelection);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('crustshare_auth');
    toast.success('已退出登录');
  };

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
      setSelectedFile(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSg5OSwgMTAyLCAyNDEsIDAuMSkiLz48L3N2Zz4=')] opacity-30" />

      <div className="relative container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                CrustShare
              </h1>
              <p className="text-muted-foreground mt-1">安全的分布式文件存储平台</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh} className="crystal-card">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleLogout} className="crystal-card">
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            </div>
          </div>
        </div>

        {/* 存储统计 */}
        <StorageStats />

        {/* 操作区域 */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
