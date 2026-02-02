"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  GripHorizontal,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/image-viewer";
import { MediaPlayer } from "@/components/media-player";
import { isImageFile, isMediaFile, isVideoFile, isAudioFile } from "@/lib/utils";
import type { FileRecord, Gateway } from "@/types";

interface PreviewModalProps {
  file: FileRecord | null;
  isOpen: boolean;
  gateways: Gateway[];
  onClose: () => void;
}

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  prevState: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export function PreviewModal({ file, isOpen, gateways, onClose }: PreviewModalProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ direction: string; startX: number; startY: number; startWidth: number; startHeight: number; startLeft: number; startTop: number } | null>(null);

  const [windowState, setWindowState] = useState<WindowState>({
    x: 100,
    y: 100,
    width: 800,
    height: 600,
    isMaximized: false,
    prevState: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 重置窗口状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const defaultWidth = Math.min(900, screenWidth - 40);
      const defaultHeight = Math.min(700, screenHeight - 40);
      
      setWindowState({
        x: (screenWidth - defaultWidth) / 2,
        y: (screenHeight - defaultHeight) / 2,
        width: defaultWidth,
        height: defaultHeight,
        isMaximized: false,
        prevState: null,
      });
    }
  }, [isOpen]);

  // 处理窗口最大化/还原
  const toggleMaximize = useCallback(() => {
    setWindowState((prev) => {
      if (prev.isMaximized) {
        // 还原
        return {
          ...prev.prevState!,
          isMaximized: false,
          prevState: null,
        };
      } else {
        // 最大化
        return {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          isMaximized: true,
          prevState: {
            x: prev.x,
            y: prev.y,
            width: prev.width,
            height: prev.height,
          },
        };
      }
    });
  }, []);

  // 开始拖动
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowState.isMaximized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - windowState.x,
      y: e.clientY - windowState.y,
    });
  }, [windowState.x, windowState.y, windowState.isMaximized]);

  // 拖动中
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // 限制窗口不被拖出屏幕太多
        const maxX = window.innerWidth - 100;
        const maxY = window.innerHeight - 50;
        
        setWindowState((prev) => ({
          ...prev,
          x: Math.max(-prev.width + 100, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        }));
      }

      if (isResizing && resizeRef.current) {
        const { direction, startX, startY, startWidth, startHeight, startLeft, startTop } = resizeRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startLeft;
        let newY = startTop;

        if (direction.includes('e')) {
          newWidth = Math.max(400, startWidth + deltaX);
        }
        if (direction.includes('w')) {
          const proposedWidth = startWidth - deltaX;
          if (proposedWidth >= 400) {
            newWidth = proposedWidth;
            newX = startLeft + deltaX;
          }
        }
        if (direction.includes('s')) {
          newHeight = Math.max(300, startHeight + deltaY);
        }
        if (direction.includes('n')) {
          const proposedHeight = startHeight - deltaY;
          if (proposedHeight >= 300) {
            newHeight = proposedHeight;
            newY = startTop + deltaY;
          }
        }

        setWindowState((prev) => ({
          ...prev,
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart]);

  // 开始调整大小
  const startResize = useCallback((direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (windowState.isMaximized) return;
    
    setIsResizing(true);
    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: windowState.width,
      startHeight: windowState.height,
      startLeft: windowState.x,
      startTop: windowState.y,
    };
  }, [windowState]);

  // 获取文件图标
  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) return <ImageIcon className="h-4 w-4 text-blue-400" />;
    if (isVideoFile(filename)) return <FileVideo className="h-4 w-4 text-purple-400" />;
    if (isAudioFile(filename)) return <FileAudio className="h-4 w-4 text-green-400" />;
    return <FileText className="h-4 w-4 text-slate-400" />;
  };

  if (!isOpen || !file) return null;

  const isImage = isImageFile(file.name);
  const isMedia = isMediaFile(file.name);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 - 点击关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* 可拖动窗口 */}
          <motion.div
            ref={windowRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              left: windowState.x,
              top: windowState.y,
              width: windowState.width,
              height: windowState.height,
              cursor: isDragging ? 'grabbing' : 'default',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 窗口标题栏 - 可拖动区域 */}
            <div
              ref={headerRef}
              className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 select-none"
              style={{ cursor: windowState.isMaximized ? 'default' : 'grab' }}
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <GripHorizontal className="h-4 w-4 text-slate-400" />
                {getFileIcon(file.name)}
                <span className="text-sm font-medium text-slate-700 truncate">
                  {file.name}
                </span>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleMaximize}
                >
                  {windowState.isMaximized ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 窗口内容区域 */}
            <div className="flex-1 overflow-hidden bg-slate-900 relative">
              {isImage && (
                <div className="w-full h-full">
                  <ImageViewer
                    cid={file.cid}
                    filename={file.name}
                    gateways={gateways}
                    onClose={onClose}
                  />
                </div>
              )}

              {isMedia && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <div className="w-full max-w-4xl">
                    <MediaPlayer
                      cid={file.cid}
                      filename={file.name}
                      gateways={gateways}
                    />
                  </div>
                </div>
              )}

              {!isImage && !isMedia && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">此文件类型暂不支持预览</p>
                    <p className="text-slate-500 text-sm mt-2">{file.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 调整大小手柄 */}
            {!windowState.isMaximized && (
              <>
                {/* 东 */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 cursor-e-resize hover:bg-blue-400/50 transition-colors"
                  onMouseDown={(e) => startResize('e', e)}
                />
                {/* 西 */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 cursor-w-resize hover:bg-blue-400/50 transition-colors"
                  onMouseDown={(e) => startResize('w', e)}
                />
                {/* 南 */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 cursor-s-resize hover:bg-blue-400/50 transition-colors"
                  onMouseDown={(e) => startResize('s', e)}
                />
                {/* 北 */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 cursor-n-resize hover:bg-blue-400/50 transition-colors"
                  onMouseDown={(e) => startResize('n', e)}
                />
                {/* 东南 */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                  onMouseDown={(e) => startResize('se', e)}
                >
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-slate-400/50 rounded-sm" />
                </div>
                {/* 西南 */}
                <div
                  className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                  onMouseDown={(e) => startResize('sw', e)}
                >
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-slate-400/50 rounded-sm" />
                </div>
                {/* 东北 */}
                <div
                  className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                  onMouseDown={(e) => startResize('ne', e)}
                >
                  <div className="absolute top-1 right-1 w-2 h-2 bg-slate-400/50 rounded-sm" />
                </div>
                {/* 西北 */}
                <div
                  className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                  onMouseDown={(e) => startResize('nw', e)}
                >
                  <div className="absolute top-1 left-1 w-2 h-2 bg-slate-400/50 rounded-sm" />
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
