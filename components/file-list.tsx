"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Copy, Check, Download, Folder, Trash2, ChevronDown, Globe, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { FileRecord, Gateway } from "@/types";
import { formatFileSize, formatDate, getFileIcon, getFileExtension } from "@/lib/utils";

interface FileListProps {
  files: FileRecord[];
  viewMode: "list" | "grid";
  isLoading: boolean;
  copiedId: string | number | null;
  selectedFiles: string[];
  onCopyCid: (cid: string, fileId: string | number) => void;
  onDownload: (cid: string, filename: string) => void;
  onDownloadWithGateway: (cid: string, filename: string, gateway: Gateway) => void;
  onDownloadMenu: (file: FileRecord) => void;
  onMove: (file: FileRecord) => void;
  onDelete: (fileId: string | number) => void;
  onPreview?: (file: FileRecord) => void;
  onRename?: (file: FileRecord) => void;
  onToggleSelection?: (fileId: string) => void;
  onSelectAll?: () => void;
  gateways?: Gateway[];
}

export function FileList({
  files,
  viewMode,
  isLoading,
  copiedId,
  selectedFiles,
  onCopyCid,
  onDownload,
  onDownloadWithGateway,
  onDownloadMenu,
  onMove,
  onDelete,
  onPreview,
  onRename,
  onToggleSelection,
  onSelectAll,
  gateways = [],
}: FileListProps) {
  const [openGatewayMenuId, setOpenGatewayMenuId] = useState<string | number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDownloadWithGateway = (file: FileRecord, gateway: Gateway) => {
    onDownloadWithGateway(file.cid, file.name, gateway);
    setOpenGatewayMenuId(null);
  };

  const allSelected = files.length > 0 && files.every((f) => selectedFiles.includes(String(f.id)));
  const someSelected = selectedFiles.length > 0 && !allSelected;

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenGatewayMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloudchan-purple border-t-transparent" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Cloud className="mb-4 h-16 w-16 opacity-50" />
        <p className="text-lg font-medium">暂无文件</p>
        <p className="text-sm">拖拽文件到此处或点击上传按钮</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="rounded-xl glass">
        <table className="w-full">
          <thead className="bg-white/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium w-10">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                  onCheckedChange={onSelectAll}
                  aria-label="全选"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">文件名</th>
              <th className="px-4 py-3 text-left text-sm font-medium">大小</th>
              <th className="px-4 py-3 text-left text-sm font-medium">上传时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">CID</th>
              <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => (
              <motion.tr
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border-t border-white/20 hover:bg-white/30 ${selectedFiles.includes(String(file.id)) ? "bg-cloudchan-purple/10" : ""}`}
              >
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedFiles.includes(String(file.id))}
                    onCheckedChange={() => onToggleSelection?.(String(file.id))}
                    aria-label={`选择 ${file.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center cursor-pointer hover:text-cloudchan-purple transition-colors group"
                    onClick={() => onPreview?.(file)}
                    title="点击预览"
                  >
                    <span className="mr-2">{getFileIcon(file.name)}</span>
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    {getFileExtension(file.name) && (
                      <span className="ml-1.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        .{getFileExtension(file.name)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{formatFileSize(file.size)}</td>
                <td className="px-4 py-3 text-sm">{formatDate(file.date)}</td>
                <td className="px-4 py-3">
                  <code className="rounded bg-white/50 px-2 py-1 text-xs">
                    {file.cid.slice(0, 12)}...
                  </code>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onCopyCid(file.cid, file.id)}
                      title="复制 CID"
                    >
                      {copiedId === file.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="relative" ref={openGatewayMenuId === file.id ? menuRef : null}>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 rounded-r-none border-r-0"
                          onClick={() => onDownload(file.cid, file.name)}
                          title="立即下载"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          下载
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-6 rounded-l-none px-1"
                          onClick={() => setOpenGatewayMenuId(openGatewayMenuId === file.id ? null : file.id)}
                          title="选择网关下载"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <AnimatePresence>
                        {openGatewayMenuId === file.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-1"
                          >
                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                选择网关下载
                              </p>
                            </div>
                            {gateways.filter(g => g.available).length === 0 ? (
                              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                                暂无可用网关
                              </div>
                            ) : (
                              gateways
                                .filter(g => g.available)
                                .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity))
                                .map(gateway => (
                                  <button
                                    key={gateway.name}
                                    onClick={() => handleDownloadWithGateway(file, gateway)}
                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                                  >
                                    <div className="flex items-center">
                                      <span className="text-sm mr-2">{gateway.icon}</span>
                                      <span className="text-sm text-slate-700 dark:text-slate-300">{gateway.name}</span>
                                    </div>
                                    <span className="text-xs text-green-600">{gateway.latency}ms</span>
                                  </button>
                                ))
                            )}
                            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                              <button
                                onClick={() => {
                                  onDownloadMenu(file);
                                  setOpenGatewayMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm text-slate-600 dark:text-slate-400 flex items-center"
                              >
                                <Globe className="h-4 w-4 mr-2" />
                                更多网关选项...
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMove(file)}
                      title="移动到文件夹"
                    >
                      <Folder className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRename?.(file)}
                      title="重命名"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(file.id)}
                      title="删除"
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
    );
  }

  // Grid view
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {files.map((file, index) => (
        <motion.div
          key={file.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className={`glass rounded-xl p-4 card-hover cursor-pointer relative group ${selectedFiles.includes(String(file.id)) ? "ring-2 ring-cloudchan-purple bg-cloudchan-purple/10" : ""}`}
          onClick={() => onPreview?.(file)}
        >
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedFiles.includes(String(file.id))}
              onCheckedChange={() => onToggleSelection?.(String(file.id))}
              aria-label={`选择 ${file.name}`}
            />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/80"
              onClick={(e) => {
                e.stopPropagation();
                onCopyCid(file.cid, file.id);
              }}
              title="复制 CID"
            >
              {copiedId === file.id ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <div className="relative" ref={openGatewayMenuId === file.id ? menuRef : undefined}>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white/80 rounded-r-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file.cid, file.name);
                  }}
                  title="立即下载"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-5 bg-white/80 rounded-l-none px-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenGatewayMenuId(openGatewayMenuId === file.id ? null : file.id);
                  }}
                  title="选择网关下载"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
              <AnimatePresence>
                {openGatewayMenuId === file.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-1"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        选择网关
                      </p>
                    </div>
                    {gateways.filter(g => g.available).length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 text-center">
                        暂无可用网关
                      </div>
                    ) : (
                      gateways
                        .filter(g => g.available)
                        .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity))
                        .slice(0, 5)
                        .map(gateway => (
                          <button
                            key={gateway.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadWithGateway(file, gateway);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span className="text-xs mr-1.5">{gateway.icon}</span>
                              <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{gateway.name}</span>
                            </div>
                            <span className="text-xs text-green-600">{gateway.latency}ms</span>
                          </button>
                        ))
                    )}
                    <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadMenu(file);
                          setOpenGatewayMenuId(null);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-xs text-slate-600 dark:text-slate-400 flex items-center"
                      >
                        <Globe className="h-3 w-3 mr-1.5" />
                        更多选项...
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/80"
              onClick={(e) => {
                e.stopPropagation();
                onMove(file);
              }}
              title="移动到文件夹"
            >
              <Folder className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/80"
              onClick={(e) => {
                e.stopPropagation();
                onRename?.(file);
              }}
              title="重命名"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-white/80 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
              title="删除"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <div className="mb-3 flex h-16 items-center justify-center text-4xl">
            {getFileIcon(file.name)}
          </div>
          <p className="truncate text-sm font-medium">{file.name}</p>
          <div className="flex items-center justify-center space-x-1">
            {getFileExtension(file.name) && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                .{getFileExtension(file.name)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </motion.div>
      ))}
    </div>
  );
}
