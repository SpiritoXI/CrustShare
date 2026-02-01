"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  AlertCircle,
  RefreshCw,
  Loader2,
  Globe,
  Check,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  ChevronUp,
  Zap,
  Wifi,
  WifiOff,
  Gauge,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getMediaMimeType, isVideoFile, isAudioFile } from "@/lib/utils";
import { gatewayApi } from "@/lib/api";
import { useStreamingOptimizer, type PreloadStrategy } from "@/hooks/use-streaming-optimizer";
import type { Gateway } from "@/types";

interface MediaPlayerProps {
  cid: string;
  filename: string;
  gateways: Gateway[];
  onGatewaySwitch?: (gateway: Gateway) => void;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  buffered: number;
  playbackRate: number;
}

// 缓冲区健康度计算
function calculateBufferHealth(buffered: number, currentTime: number, duration: number): number {
  if (!duration || duration === 0) return 0;
  const bufferedAhead = buffered - currentTime;
  const maxBuffer = Math.min(30, duration * 0.3); // 最大30秒或30%时长
  return Math.min(bufferedAhead / maxBuffer, 1);
}

export function MediaPlayer({ cid, filename, gateways, onGatewaySwitch }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>();
  const gatewayMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const downloadSpeedRef = useRef<number>(0);
  const lastDownloadCheckRef = useRef<number>(0);

  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showGatewayMenu, setShowGatewayMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [availableGateways, setAvailableGateways] = useState<Gateway[]>([]);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [fastestGateway, setFastestGateway] = useState<Gateway | null>(null);
  const [currentBitrate, setCurrentBitrate] = useState(4000);
  const [bitrateSwitchInfo, setBitrateSwitchInfo] = useState<string | null>(null);

  // 使用流媒体优化 hook
  const {
    networkStatus,
    networkQuality,
    preloadConfig,
    preloadStrategy,
    recommendedBitrate,
    currentBitrateLevel,
    setPreloadStrategy,
    getPreloadAttribute,
    adaptBitrate,
    measureDownloadSpeed,
  } = useStreamingOptimizer();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gatewayMenuRef.current && !gatewayMenuRef.current.contains(event.target as Node)) {
        setShowGatewayMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    buffered: 0,
    playbackRate: 1,
  });

  const isVideo = isVideoFile(filename);
  const isAudio = isAudioFile(filename);
  const mediaType = isVideo ? "video" : "audio";
  const mimeType = getMediaMimeType(filename);

  // 获取可用网关列表 - 如果没有可用网关，使用所有网关作为备选
  useEffect(() => {
    const available = gateways
      .filter((g) => g.available)
      .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
    // 如果没有可用网关，使用所有网关作为备选
    setAvailableGateways(available.length > 0 ? available : gateways);
  }, [gateways]);

  // 根据网络状态更新初始码率
  useEffect(() => {
    setCurrentBitrate(recommendedBitrate);
  }, [recommendedBitrate]);

  // 智能选择最快网关
  const autoSelectFastestGateway = useCallback(async () => {
    if (availableGateways.length === 0 || isAutoSelecting) return;

    setIsAutoSelecting(true);
    try {
      const result = await gatewayApi.multiGatewayDownload(cid, availableGateways);
      if (result && result.gateway) {
        setFastestGateway(result.gateway);
        // 找到最快网关在列表中的索引
        const index = availableGateways.findIndex(g => g.url === result.gateway.url);
        if (index !== -1 && index !== currentGatewayIndex) {
          setCurrentGatewayIndex(index);
          // 触发媒体重新加载
          const media = isVideo ? videoRef.current : audioRef.current;
          if (media) {
            media.load();
          }
          onGatewaySwitch?.(result.gateway);
        }
      }
    } catch {
      console.error("自动选择最快网关失败");
    } finally {
      setIsAutoSelecting(false);
    }
  }, [availableGateways, cid, currentGatewayIndex, isAutoSelecting, isVideo, onGatewaySwitch]);

  // 组件挂载时智能选择最快网关
  useEffect(() => {
    if (availableGateways.length > 0 && !fastestGateway) {
      autoSelectFastestGateway();
    }
  }, [availableGateways, fastestGateway, autoSelectFastestGateway]);

  // 获取当前媒体URL
  const getCurrentMediaUrl = useCallback(() => {
    if (availableGateways.length === 0) return null;
    const gateway = availableGateways[currentGatewayIndex];
    return `${gateway.url}${cid}`;
  }, [availableGateways, currentGatewayIndex, cid]);

  const mediaRef = isVideo ? videoRef : audioRef;

  // 切换到指定网关
  const switchToGateway = useCallback((index: number) => {
    if (index === currentGatewayIndex) {
      setShowGatewayMenu(false);
      return;
    }

    setCurrentGatewayIndex(index);
    setError(null);
    setIsLoading(true);
    setShowGatewayMenu(false);

    const nextGateway = availableGateways[index];
    onGatewaySwitch?.(nextGateway);

    // 重新加载媒体
    const media = isVideo ? videoRef.current : audioRef.current;
    if (media) {
      media.load();
    }
  }, [availableGateways, currentGatewayIndex, onGatewaySwitch, isVideo]);

  // 切换到下一个网关
  const switchToNextGateway = useCallback(() => {
    if (availableGateways.length <= 1) {
      setError("所有网关都无法播放此媒体文件");
      return;
    }

    const nextIndex = (currentGatewayIndex + 1) % availableGateways.length;
    switchToGateway(nextIndex);
  }, [availableGateways, currentGatewayIndex, switchToGateway]);

  // 获取信号强度图标
  const getSignalIcon = (latency: number | undefined) => {
    if (!latency || latency === Infinity) return <Signal className="h-3 w-3 text-slate-400" />;
    if (latency < 500) return <SignalHigh className="h-3 w-3 text-green-400" />;
    if (latency < 1500) return <SignalMedium className="h-3 w-3 text-yellow-400" />;
    return <SignalLow className="h-3 w-3 text-red-400" />;
  };

  // 重试当前网关
  const retryCurrentGateway = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (mediaRef.current) {
      mediaRef.current.load();
    }
  }, [mediaRef]);

  // 播放/暂停控制
  const togglePlay = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (playerState.isPlaying) {
      media.pause();
    } else {
      media.play().catch((err) => {
        console.error("播放失败:", err);
        setError("播放失败，尝试切换网关...");
        switchToNextGateway();
      });
    }
  }, [playerState.isPlaying, mediaRef, switchToNextGateway]);

  // 进度控制
  const handleSeek = useCallback((value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newTime = value[0];
    media.currentTime = newTime;
    setPlayerState((prev) => ({ ...prev, currentTime: newTime }));
  }, [mediaRef]);

  // 音量控制
  const handleVolumeChange = useCallback((value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newVolume = value[0];
    media.volume = newVolume;
    setPlayerState((prev) => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0,
    }));
  }, [mediaRef]);

  // 静音切换
  const toggleMute = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    const newMuted = !playerState.isMuted;
    media.muted = newMuted;
    setPlayerState((prev) => ({ ...prev, isMuted: newMuted }));
  }, [playerState.isMuted, mediaRef]);

  // 全屏切换
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
      }
    } catch (err) {
      console.error("全屏切换失败:", err);
    }
  }, []);

  // 快进/快退
  const skip = useCallback((seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;

    const newTime = Math.max(0, Math.min(media.duration || 0, media.currentTime + seconds));
    media.currentTime = newTime;
  }, [mediaRef]);

  // 播放速度控制
  const changePlaybackRate = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playerState.playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    media.playbackRate = nextRate;
    setPlayerState((prev) => ({ ...prev, playbackRate: nextRate }));
  }, [playerState.playbackRate, mediaRef]);

  // 自适应码率监测
  const checkAdaptiveBitrate = useCallback(async () => {
    const media = mediaRef.current;
    if (!media || !isVideo) return;

    // 计算缓冲区健康度
    const bufferHealth = calculateBufferHealth(
      playerState.buffered,
      playerState.currentTime,
      playerState.duration
    );

    // 定期测量下载速度
    const now = Date.now();
    if (now - lastDownloadCheckRef.current > 10000) { // 每10秒测量一次
      lastDownloadCheckRef.current = now;
      const currentUrl = getCurrentMediaUrl();
      if (currentUrl) {
        const speed = await measureDownloadSpeed(currentUrl);
        downloadSpeedRef.current = speed;
      }
    }

    // 自适应码率调整
    const result = adaptBitrate(
      bufferHealth,
      downloadSpeedRef.current,
      currentBitrate
    );

    if (result.shouldSwitch && result.newBitrate !== currentBitrate) {
      setCurrentBitrate(result.newBitrate);
      setBitrateSwitchInfo(result.reason);
      
      // 3秒后清除提示
      setTimeout(() => setBitrateSwitchInfo(null), 3000);
    }
  }, [playerState.buffered, playerState.currentTime, playerState.duration, currentBitrate, adaptBitrate, measureDownloadSpeed, isVideo]);

  // 定期监测自适应码率
  useEffect(() => {
    if (!isVideo || !preloadConfig.adaptiveBitrate) return;

    const intervalId = setInterval(checkAdaptiveBitrate, 5000);
    return () => clearInterval(intervalId);
  }, [checkAdaptiveBitrate, isVideo, preloadConfig.adaptiveBitrate]);

  // 媒体事件监听
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setPlayerState((prev) => ({
        ...prev,
        currentTime: media.currentTime,
        buffered: media.buffered.length > 0 ? media.buffered.end(media.buffered.length - 1) : 0,
      }));
    };

    const handleProgress = () => {
      // 更新缓冲进度
      if (media.buffered.length > 0) {
        setPlayerState((prev) => ({
          ...prev,
          buffered: media.buffered.end(media.buffered.length - 1),
        }));
      }
    };

    const handleLoadedMetadata = () => {
      setPlayerState((prev) => ({ ...prev, duration: media.duration }));
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleCanPlayThrough = () => {
      // 可以流畅播放，停止加载提示
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
      // 网络卡顿，触发码率调整检查
      if (isVideo && preloadConfig.adaptiveBitrate) {
        checkAdaptiveBitrate();
      }
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    const handleError = () => {
      console.error("媒体加载错误");
      setError("当前网关无法播放，尝试切换...");
      switchToNextGateway();
    };

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("progress", handleProgress);
    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("canplay", handleCanPlay);
    media.addEventListener("canplaythrough", handleCanPlayThrough);
    media.addEventListener("waiting", handleWaiting);
    media.addEventListener("playing", handlePlaying);
    media.addEventListener("pause", handlePause);
    media.addEventListener("ended", handleEnded);
    media.addEventListener("error", handleError);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("progress", handleProgress);
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("canplay", handleCanPlay);
      media.removeEventListener("canplaythrough", handleCanPlayThrough);
      media.removeEventListener("waiting", handleWaiting);
      media.removeEventListener("playing", handlePlaying);
      media.removeEventListener("pause", handlePause);
      media.removeEventListener("ended", handleEnded);
      media.removeEventListener("error", handleError);
    };
  }, [mediaRef, switchToNextGateway, checkAdaptiveBitrate, isVideo, preloadConfig.adaptiveBitrate]);

  // 自动隐藏控制栏
  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    if (playerState.isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [playerState.isPlaying]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentUrl = getCurrentMediaUrl();
  const currentGateway = availableGateways[currentGatewayIndex];

  // 音频播放器样式
  if (isAudio) {
    return (
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        {/* 音频可视化效果 */}
        <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
          <div className="flex items-end space-x-1 h-16">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-2 bg-blue-500 rounded-full"
                animate={{
                  height: playerState.isPlaying
                    ? [20, Math.random() * 60 + 20, 20]
                    : 20,
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            {availableGateways.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={switchToNextGateway}
                className="text-red-400 hover:text-red-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                切换网关
              </Button>
            )}
          </div>
        )}

        {/* 控制栏 */}
        <div className="p-4 space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <Slider
              value={[playerState.currentTime]}
              max={playerState.duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{formatTime(playerState.currentTime)}</span>
              <span>{formatTime(playerState.duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                className="text-slate-300 hover:text-white"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700"
              >
                {playerState.isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                className="text-slate-300 hover:text-white"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {/* 音量控制 */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-slate-300 hover:text-white"
                >
                  {playerState.isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[playerState.isMuted ? 0 : playerState.volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>

              {/* 播放速度 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={changePlaybackRate}
                className="text-slate-300 hover:text-white"
              >
                {playerState.playbackRate}x
              </Button>
            </div>
          </div>

          {/* 网关选择 */}
          {availableGateways.length > 0 && (
            <div className="flex items-center justify-center" ref={gatewayMenuRef}>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGatewayMenu(!showGatewayMenu)}
                  className="text-slate-400 hover:text-white text-xs flex items-center space-x-1"
                >
                  <Globe className="h-3 w-3" />
                  <span>{currentGateway?.name || `网关 ${currentGatewayIndex + 1}`}</span>
                  {currentGateway?.latency && currentGateway.latency !== Infinity && (
                    <span className="text-slate-500">({currentGateway.latency}ms)</span>
                  )}
                  <ChevronUp className="h-3 w-3 ml-1" />
                </Button>

                {/* 网关选择菜单 */}
                <AnimatePresence>
                  {showGatewayMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50"
                    >
                      <div className="p-2 border-b border-slate-700">
                        <p className="text-xs text-slate-400 font-medium">选择网关</p>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {availableGateways.map((gateway, index) => (
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
                      {availableGateways.length > 1 && (
                        <div className="p-2 border-t border-slate-700 space-y-1">
                          <button
                            onClick={() => {
                              autoSelectFastestGateway();
                              setShowGatewayMenu(false);
                            }}
                            disabled={isAutoSelecting}
                            className="w-full px-3 py-1.5 text-xs text-yellow-300 hover:text-yellow-200 hover:bg-slate-700 rounded transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                          >
                            {isAutoSelecting ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>智能选择中...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3" />
                                <span>智能选择最快</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={switchToNextGateway}
                            className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center justify-center space-x-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>切换下一个</span>
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

        <audio
          ref={audioRef}
          src={currentUrl || undefined}
          preload={getPreloadAttribute()}
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  // 视频播放器
  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playerState.isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={currentUrl || undefined}
        className="w-full aspect-video"
        preload={getPreloadAttribute()}
        crossOrigin="anonymous"
        playsInline
        onClick={togglePlay}
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-white text-sm">加载中...</p>
            {currentGateway && (
              <p className="text-slate-400 text-xs mt-1">
                通过 {currentGateway.name} 加载
              </p>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-white mb-2">{error}</p>
            <div className="flex space-x-2 justify-center">
              <Button variant="outline" size="sm" onClick={retryCurrentGateway}>
                <RefreshCw className="h-4 w-4 mr-1" />
                重试
              </Button>
              {availableGateways.length > 1 && (
                <Button variant="default" size="sm" onClick={switchToNextGateway}>
                  切换网关
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
          >
            {/* 顶部信息 */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div>
                  <h3 className="text-white font-medium truncate max-w-md">{filename}</h3>
                  {/* 码率切换提示 */}
                  {bitrateSwitchInfo && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-yellow-400 mt-1 flex items-center"
                    >
                      <Gauge className="h-3 w-3 mr-1" />
                      {bitrateSwitchInfo}
                    </motion.p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 网络状态指示器 */}
                <div className="flex items-center space-x-1 text-xs text-white/80 bg-black/30 px-2 py-1 rounded">
                  {networkQuality === "offline" ? (
                    <WifiOff className="h-3 w-3 text-red-400" />
                  ) : (
                    <Wifi className="h-3 w-3 text-green-400" />
                  )}
                  <span className="capitalize">{networkQuality}</span>
                  {networkStatus.downlink > 0 && (
                    <span className="text-slate-400">({networkStatus.downlink}Mbps)</span>
                  )}
                </div>

                {/* 设置按钮 */}
                <div className="relative" ref={settingsMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="text-white hover:bg-white/20 text-xs"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>

                  {/* 设置菜单 */}
                  <AnimatePresence>
                    {showSettingsMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50"
                      >
                        <div className="p-2 border-b border-slate-700">
                          <p className="text-xs text-slate-400 font-medium">播放设置</p>
                        </div>
                        
                        {/* 预加载策略 */}
                        <div className="p-3 space-y-2">
                          <p className="text-xs text-slate-300">预加载策略</p>
                          <div className="grid grid-cols-2 gap-1">
                            {(["none", "metadata", "auto", "smart"] as PreloadStrategy[]).map((strategy) => (
                              <button
                                key={strategy}
                                onClick={() => {
                                  setPreloadStrategy(strategy);
                                  setShowSettingsMenu(false);
                                }}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  preloadStrategy === strategy
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                }`}
                              >
                                {strategy === "none" && "无"}
                                {strategy === "metadata" && "元数据"}
                                {strategy === "auto" && "自动"}
                                {strategy === "smart" && "智能"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 当前码率信息 */}
                        <div className="p-3 border-t border-slate-700 space-y-2">
                          <p className="text-xs text-slate-300">当前码率</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white">{currentBitrateLevel.name}</span>
                            <span className="text-xs text-slate-400">{currentBitrateLevel.bitrate}kbps</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            推荐: {currentBitrateLevel.width}x{currentBitrateLevel.height}@{currentBitrateLevel.fps}fps
                          </div>
                        </div>

                        {/* 网络信息 */}
                        <div className="p-3 border-t border-slate-700 space-y-1">
                          <p className="text-xs text-slate-300">网络状态</p>
                          <div className="text-xs text-slate-400 space-y-1">
                            <div className="flex justify-between">
                              <span>延迟:</span>
                              <span>{networkStatus.rtt}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span>类型:</span>
                              <span>{networkStatus.effectiveType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>下载速度:</span>
                              <span>{networkStatus.downlink}Mbps</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 网关选择 */}
                {availableGateways.length > 0 && (
                  <div className="relative" ref={gatewayMenuRef}>
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
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-50"
                        >
                          <div className="p-2 border-b border-slate-700">
                            <p className="text-xs text-slate-400 font-medium">选择网关</p>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {availableGateways.map((gateway, index) => (
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
                          {availableGateways.length > 1 && (
                            <div className="p-2 border-t border-slate-700 space-y-1">
                              <button
                                onClick={() => {
                                  autoSelectFastestGateway();
                                  setShowGatewayMenu(false);
                                }}
                                disabled={isAutoSelecting}
                                className="w-full px-3 py-1.5 text-xs text-yellow-300 hover:text-yellow-200 hover:bg-slate-700 rounded transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
                              >
                                {isAutoSelecting ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>智能选择中...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3" />
                                    <span>智能选择最快</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={switchToNextGateway}
                                className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors flex items-center justify-center space-x-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>切换下一个</span>
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* 中央播放按钮 */}
            {!playerState.isPlaying && !isLoading && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                >
                  <Play className="h-8 w-8 text-white ml-1" />
                </Button>
              </div>
            )}

            {/* 底部控制栏 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              {/* 进度条 */}
              <div className="group/slider">
                <Slider
                  value={[playerState.currentTime]}
                  max={playerState.duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                {/* 缓冲进度 */}
                <div
                  className="h-1 bg-slate-600/50 rounded-full mt-1 transition-all"
                  style={{
                    width: `${(playerState.buffered / (playerState.duration || 1)) * 100}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {playerState.isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => skip(-10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => skip(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>

                  {/* 音量控制 */}
                  <div className="flex items-center space-x-2 group/volume">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {playerState.isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all">
                      <Slider
                        value={[playerState.isMuted ? 0 : playerState.volume]}
                        max={1}
                        step={0.1}
                        onValueChange={handleVolumeChange}
                      />
                    </div>
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* 播放速度 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={changePlaybackRate}
                    className="text-white hover:bg-white/20"
                  >
                    {playerState.playbackRate}x
                  </Button>

                  {/* 全屏 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {playerState.isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
