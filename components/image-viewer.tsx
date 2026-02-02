"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Globe,
  Check,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isImageFile, getImageMimeType } from "@/lib/utils";
import type { Gateway } from "@/types";

interface ImageViewerProps {
  cid: string;
  filename: string;
  gateways: Gateway[];
  onClose?: () => void;
  onDownload?: () => void;
}

interface ImageState {
  scale: number;
  rotation: number;
  position: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

export function ImageViewer({ cid, filename, gateways, onClose, onDownload }: ImageViewerProps) {
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGatewayMenu, setShowGatewayMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const gatewayMenuRef = useRef<HTMLDivElement>(null);

  const [imageState, setImageState] = useState<ImageState>({
    scale: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  // 点击外部关闭网关选择菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gatewayMenuRef.current && !gatewayMenuRef.current.contains(event.target as Node)) {
        setShowGatewayMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 获取可用网关列表 - 如果没有可用网关，使用所有网关作为备选
  const availableGateways = gateways
    .filter((g) => g.available)
    .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));

  // 如果没有可用网关，使用所有网关作为备选
  const effectiveGateways = availableGateways.length > 0 ? availableGateways : gateways;

  // 获取当前图片URL
  const getCurrentImageUrl = useCallback(() => {
    if (effectiveGateways.length === 0) return null;
    const gateway = effectiveGateways[currentGatewayIndex];
    return `${gateway.url}${cid}`;
  }, [effectiveGateways, currentGatewayIndex, cid]);

  // 切换到指定网关
  const switchToGateway = useCallback((index: number) => {
    if (index === currentGatewayIndex) {
      setShowGatewayMenu(false);
      return;
    }

    setCurrentGatewayIndex(index);
    setError(null);
    setIsLoading(true);
    setImageLoaded(false);
    setShowGatewayMenu(false);
    // 重置图片状态
    setImageState({
      scale: 1,
      rotation: 0,
      position: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  }, [currentGatewayIndex]);

  // 切换到下一个网关
  const switchToNextGateway = useCallback(() => {
    if (effectiveGateways.length <= 1) {
      setError("所有网关都无法加载此图片");
      return;
    }

    const nextIndex = (currentGatewayIndex + 1) % effectiveGateways.length;
    switchToGateway(nextIndex);
  }, [effectiveGateways, currentGatewayIndex, switchToGateway]);

  // 获取信号强度图标
  const getSignalIcon = (latency: number | undefined) => {
    if (!latency || latency === Infinity) return <Signal className="h-3 w-3 text-slate-400" />;
    if (latency < 500) return <SignalHigh className="h-3 w-3 text-green-400" />;
    if (latency < 1500) return <SignalMedium className="h-3 w-3 text-yellow-400" />;
    return <SignalLow className="h-3 w-3 text-red-400" />;
  };

  // 缩放控制
  const zoomIn = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 5),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, 0.25),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setImageState({
      scale: 1,
      rotation: 0,
      position: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  }, []);

  // 旋转控制
  const rotate = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("全屏切换失败:", err);
    }
  }, []);

  // 拖拽控制
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (imageState.scale > 1) {
      setImageState((prev) => ({
        ...prev,
        isDragging: true,
        dragStart: { x: e.clientX - prev.position.x, y: e.clientY - prev.position.y },
      }));
    }
  }, [imageState.scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (imageState.isDragging) {
      setImageState((prev) => ({
        ...prev,
        position: {
          x: e.clientX - prev.dragStart.x,
          y: e.clientY - prev.dragStart.y,
        },
      }));
    }
  }, [imageState.isDragging]);

  const handleMouseUp = useCallback(() => {
    setImageState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImageState((prev) => ({
      ...prev,
      scale: Math.max(0.25, Math.min(5, prev.scale + delta)),
    }));
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          } else {
            onClose?.();
          }
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          resetZoom();
          break;
        case "r":
        case "R":
          rotate();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, zoomIn, zoomOut, resetZoom, rotate, toggleFullscreen, isFullscreen]);

  const currentUrl = getCurrentImageUrl();
  const currentGateway = effectiveGateways[currentGatewayIndex];

  if (!currentUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">暂无可用网关</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-slate-900 rounded-xl overflow-hidden"
      onWheel={handleWheel}
    >
      {/* 工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium truncate max-w-md">
              {filename}
            </span>
            {currentGateway && (
              <span className="text-slate-400 text-xs">
                ({currentGateway.name})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              className="text-white hover:bg-white/20"
              title="缩小 (-)"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(imageState.scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              className="text-white hover:bg-white/20"
              title="放大 (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetZoom}
              className="text-white hover:bg-white/20"
              title="重置 (0)"
            >
              <span className="text-xs font-bold">1:1</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={rotate}
              className="text-white hover:bg-white/20"
              title="旋转 (R)"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
              title="全屏 (F)"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
            {onDownload && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDownload}
                className="text-white hover:bg-white/20"
                title="下载"
              >
                <Download className="h-5 w-5" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                title="关闭 (Esc)"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 图片显示区域 */}
      <div
        className="relative h-[500px] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-white text-sm">加载图片...</p>
              {currentGateway && (
                <p className="text-slate-400 text-xs mt-1">
                  通过 {currentGateway.name} 加载
                </p>
              )}
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-white mb-2">{error}</p>
              <div className="flex space-x-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  setImageLoaded(false);
                }}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重试
                </Button>
                <Button variant="default" size="sm" onClick={switchToNextGateway}>
                  切换网关
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 图片 */}
        <motion.img
          ref={imageRef}
          src={currentUrl}
          alt={filename}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${imageState.position.x}px, ${imageState.position.y}px) scale(${imageState.scale}) rotate(${imageState.rotation}deg)`,
            cursor: imageState.scale > 1 ? (imageState.isDragging ? "grabbing" : "grab") : "default",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onLoad={() => {
            setIsLoading(false);
            setImageLoaded(true);
          }}
          onError={() => {
            setIsLoading(false);
            setError("图片加载失败");
          }}
          draggable={false}
        />
      </div>

      {/* 底部信息栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-slate-300 text-xs">
            滚轮缩放 · 拖拽移动 · 快捷键: +/- 缩放 · 0 重置 · R 旋转 · F 全屏 · Esc 关闭
          </div>
          {effectiveGateways.length > 0 && (
            <div className="flex items-center space-x-2" ref={gatewayMenuRef}>
              {/* 网关选择下拉菜单 */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGatewayMenu(!showGatewayMenu)}
                  className="text-white hover:bg-white/20 text-xs flex items-center space-x-1"
                >
                  <Globe className="h-3 w-3" />
                  <span>{currentGateway?.name || `网关 ${currentGatewayIndex + 1}`}</span>
                  {currentGateway?.latency && currentGateway.latency !== Infinity && (
                    <span className="text-slate-400">({currentGateway.latency}ms)</span>
                  )}
                </Button>

                {/* 网关选择菜单 */}
                <AnimatePresence>
                  {showGatewayMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden"
                    >
                      <div className="p-2 border-b border-slate-700">
                        <p className="text-xs text-slate-400 font-medium">选择网关</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {effectiveGateways.map((gateway, index) => (
                          <button
                            key={gateway.url}
                            onClick={() => switchToGateway(index)}
                            className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-700 transition-colors ${
                              index === currentGatewayIndex ? 'bg-slate-700/50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{gateway.icon || '🌐'}</span>
                              <div>
                                <p className="text-sm text-white">{gateway.name}</p>
                                <p className="text-xs text-slate-400 truncate max-w-[120px]">
                                  {gateway.url.replace('/ipfs/', '')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getSignalIcon(gateway.latency)}
                              {index === currentGatewayIndex && (
                                <Check className="h-3 w-3 text-blue-400 ml-1" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      {effectiveGateways.length > 1 && (
                        <div className="p-2 border-t border-slate-700">
                          <button
                            onClick={switchToNextGateway}
                            className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center justify-center space-x-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>自动切换下一个</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 图片缩略图预览组件
interface ImageThumbnailProps {
  cid: string;
  filename: string;
  gateways: Gateway[];
  onClick?: () => void;
  className?: string;
}

export function ImageThumbnail({ cid, filename, gateways, onClick, className = "" }: ImageThumbnailProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const availableGateways = gateways.filter((g) => g.available);
    if (availableGateways.length > 0) {
      // 使用第一个可用网关
      const gateway = availableGateways[0];
      setImageUrl(`${gateway.url}${cid}`);
    }
  }, [gateways, cid]);

  if (!imageUrl || hasError) {
    return (
      <div
        className={`bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ minHeight: "200px" }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-slate-500 text-sm truncate max-w-[200px]">{filename}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative group cursor-pointer overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 ${className}`}
      onClick={onClick}
      style={{ minHeight: "200px" }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={filename}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-xs truncate">{filename}</p>
      </div>
    </div>
  );
}

// 灯箱组件 - 全屏图片查看
interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  cid: string;
  filename: string;
  gateways: Gateway[];
  onDownload?: () => void;
}

export function Lightbox({ isOpen, onClose, cid, filename, gateways, onDownload }: LightboxProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <ImageViewer
          cid={cid}
          filename={filename}
          gateways={gateways}
          onClose={onClose}
          onDownload={onDownload}
        />
      </motion.div>
    </AnimatePresence>
  );
}
