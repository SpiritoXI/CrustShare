"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Cloud,
  Upload,
  Folder,
  File,
  Search,
  Settings,
  LogOut,
  Grid3X3,
  List,
  Plus,
  Download,
  Share2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuthStore, useFileStore, useUIStore, useUploadStore } from "@/lib/store";
import { api, uploadApi } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { formatFileSize, formatDate, getFileIcon, generateId } from "@/lib/utils";
import type { FileRecord } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, logout, password } = useAuthStore();
  const { files, folders, setFiles, setFolders, selectedFiles, toggleFileSelection, clearSelection } = useFileStore();
  const { showToast } = useUIStore();
  const { isUploading, uploadProgress, setIsUploading, setUploadProgress } = useUploadStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [filesData, foldersData] = await Promise.all([api.loadFiles(), api.loadFolders()]);
      setFiles(filesData);
      setFolders(foldersData);
    } catch (error) {
      showToast("加载数据失败", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const validFiles = filesArray.filter((file) => {
      if (file.size > CONFIG.UPLOAD.MAX_SIZE) {
        showToast(`文件 ${file.name} 超过1GB限制`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const token = await api.getToken();

      for (const file of validFiles) {
        setUploadProgress(0);

        try {
          const result = await uploadApi.uploadToCrust(file, token, (progress) => {
            setUploadProgress(progress);
          });

          const fileRecord: FileRecord = {
            id: generateId(),
            name: file.name,
            size: result.size,
            cid: result.cid,
            date: new Date().toLocaleString(),
            folder_id: "default",
            hash: result.hash,
            verified: false,
            verify_status: "pending",
            uploadedAt: Date.now(),
          };

          await api.saveFile(fileRecord);
          setFiles([fileRecord, ...files]);
          showToast(`文件 ${file.name} 上传成功`, "success");

          uploadApi.verifyFile(result.cid).then((verifyResult) => {
            if (verifyResult.verified) {
              api.saveFile({ ...fileRecord, verified: true, verify_status: "ok" });
            }
          });
        } catch (error) {
          showToast(`文件 ${file.name} 上传失败`, "error");
        }
      }
    } catch (error) {
      showToast("获取上传令牌失败", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileId: string | number) => {
    if (!confirm("确定要删除这个文件吗？")) return;

    try {
      await api.deleteFile(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
      showToast("文件已删除", "success");
    } catch {
      showToast("删除失败", "error");
    }
  };

  const handleDownload = (cid: string, filename: string) => {
    const url = `https://ipfs.io/ipfs/${cid}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.cid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 glass border-r border-white/20"
      >
        <div className="flex h-16 items-center border-b border-white/20 px-6">
          <Cloud className="mr-2 h-6 w-6 text-cloudchan-purple" />
          <span className="text-xl font-bold gradient-text">CrustShare</span>
        </div>

        <div className="p-4">
          <div className="mb-6 rounded-xl bg-white/50 p-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">存储空间</div>
            <div className="mb-2 text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <Progress value={Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100)} className="h-2" />
            <div className="mt-2 text-xs text-muted-foreground">
              {files.length} 个文件 · {folders.length} 个文件夹
            </div>
          </div>

          <Button
            className="mb-4 w-full bg-gradient-to-r from-cloudchan-blue to-cloudchan-purple"
            onClick={() => document.getElementById("fileInput")?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "上传中..." : "上传文件"}
          </Button>

          <input
            id="fileInput"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Folder className="mr-2 h-4 w-4" />
              全部文件
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Upload className="mr-2 h-4 w-4" />
              最近上传
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Share2 className="mr-2 h-4 w-4" />
              我的分享
            </Button>
          </nav>
        </div>

        <div className="absolute bottom-0 w-full border-t border-white/20 p-4">
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/20 bg-white/30 px-6 backdrop-blur-sm">
          <div className="flex items-center flex-1 max-w-xl">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-white/50" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-white/50" : ""}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Upload Progress */}
        {isUploading && (
          <div className="border-b border-white/20 bg-white/30 px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">正在上传...</span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* File List */}
        <div
          className={`h-[calc(100vh-4rem)] overflow-auto p-6 ${dragOver ? "bg-cloudchan-purple/10" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloudchan-purple border-t-transparent" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Cloud className="mb-4 h-16 w-16 opacity-50" />
              <p className="text-lg font-medium">暂无文件</p>
              <p className="text-sm">拖拽文件到此处或点击上传按钮</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="rounded-xl glass overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">文件名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">大小</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">上传时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">CID</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file, index) => (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-t border-white/20 hover:bg-white/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="mr-2">{getFileIcon(file.name)}</span>
                          <span className="truncate max-w-[200px]">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatFileSize(file.size)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(file.date)}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-white/50 px-2 py-1 text-xs">{file.cid.slice(0, 12)}...</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(file.cid, file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl p-4 card-hover cursor-pointer"
                >
                  <div className="mb-3 flex h-16 items-center justify-center text-4xl">
                    {getFileIcon(file.name)}
                  </div>
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
