"use client";

import { motion } from "framer-motion";
import {
  Cloud,
  Upload,
  Folder,
  FolderOpen,
  Globe,
  LogOut,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Folder as FolderType } from "@/types";
import { formatFileSize } from "@/lib/utils";

interface SidebarProps {
  totalSize: number;
  filesCount: number;
  foldersCount: number;
  folders: FolderType[];
  currentFolderId: string | null;
  isUploading: boolean;
  isTestingGateways: boolean;
  onUploadClick: () => void;
  onAddCidClick: () => void;
  onTestGateways: () => void;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (folderId: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  totalSize,
  filesCount,
  foldersCount,
  folders,
  currentFolderId,
  isUploading,
  isTestingGateways,
  onUploadClick,
  onAddCidClick,
  onTestGateways,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onLogout,
}: SidebarProps) {
  return (
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
          <Progress value={Math.min((Math.max(0, Number(totalSize) || 0) / (1024 * 1024 * 1024)) * 100, 100)} className="h-2" />
          <div className="mt-2 text-xs text-muted-foreground">
            {filesCount} 个文件 · {foldersCount} 个文件夹
          </div>
        </div>

        <Button
          className="mb-4 w-full bg-gradient-to-r from-cloudchan-blue to-cloudchan-purple"
          onClick={onUploadClick}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "上传中..." : "上传文件"}
        </Button>

        <Button className="mb-4 w-full" variant="outline" onClick={onAddCidClick}>
          <Plus className="mr-2 h-4 w-4" />
          添加CID
        </Button>

        <nav className="space-y-1 mb-4">
          <Button
            variant="ghost"
            className={`w-full justify-start ${!currentFolderId ? "bg-white/30" : ""}`}
            onClick={() => onFolderSelect(null)}
          >
            <Folder className="mr-2 h-4 w-4" />
            全部文件
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onTestGateways}
            disabled={isTestingGateways}
          >
            <Globe className="mr-2 h-4 w-4" />
            {isTestingGateways ? "检测中..." : "网关检测"}
          </Button>
        </nav>

        {/* Folders Section */}
        <div className="border-t border-white/20 pt-4">
          <div className="flex items-center justify-between mb-2 px-3">
            <span className="text-xs font-medium text-muted-foreground uppercase">文件夹</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateFolder}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {folders.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">暂无文件夹</p>
            ) : (
              folders.map((folder) => (
                <div key={folder.id} className="group">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start text-sm ${
                      currentFolderId === folder.id ? "bg-white/30" : ""
                    }`}
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    {currentFolderId === folder.id ? (
                      <FolderOpen className="mr-2 h-4 w-4 text-cloudchan-purple" />
                    ) : (
                      <Folder className="mr-2 h-4 w-4" />
                    )}
                    <span className="truncate flex-1 text-left">{folder.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditFolder(folder);
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Button>
                </div>
              )))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 w-full border-t border-white/20 p-4">
        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </Button>
      </div>
    </motion.aside>
  );
}
