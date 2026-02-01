"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Gateway } from "@/types";

// ============================================
// 网络状态类型
// ============================================
export type NetworkQuality = "excellent" | "good" | "fair" | "poor" | "offline";

export interface NetworkStatus {
  quality: NetworkQuality;
  downlink: number;      // Mbps
  rtt: number;           // ms
  effectiveType: string; // '4g', '3g', '2g', 'slow-2g'
  saveData: boolean;
}

// ============================================
// 预加载策略类型
// ============================================
export type PreloadStrategy = "none" | "metadata" | "auto" | "smart";

export interface PreloadConfig {
  strategy: PreloadStrategy;
  preloadAhead: number;     // 提前预加载的秒数
  maxBufferSize: number;    // 最大缓冲区大小 (MB)
  adaptiveBitrate: boolean; // 是否启用自适应码率
}

// ============================================
// 自适应码率配置
// ============================================
export interface BitrateLevel {
  name: string;
  bitrate: number;      // kbps
  width: number;        // 视频宽度
  height: number;       // 视频高度
  fps: number;
}

// 默认码率等级配置
export const DEFAULT_BITRATE_LEVELS: BitrateLevel[] = [
  { name: "4K", bitrate: 8000, width: 3840, height: 2160, fps: 30 },
  { name: "1440p", bitrate: 6000, width: 2560, height: 1440, fps: 30 },
  { name: "1080p", bitrate: 4000, width: 1920, height: 1080, fps: 30 },
  { name: "720p", bitrate: 2500, width: 1280, height: 720, fps: 30 },
  { name: "480p", bitrate: 1000, width: 854, height: 480, fps: 30 },
  { name: "360p", bitrate: 500, width: 640, height: 360, fps: 30 },
  { name: "240p", bitrate: 250, width: 426, height: 240, fps: 30 },
];

// ============================================
// 网络质量对应的推荐码率
// ============================================
export const NETWORK_QUALITY_BITRATES: Record<NetworkQuality, number> = {
  excellent: 8000,  // 4K
  good: 4000,       // 1080p
  fair: 1000,       // 480p
  poor: 500,        // 360p
  offline: 0,
};

// ============================================
// 智能预加载配置
// ============================================
export const SMART_PRELOAD_CONFIG = {
  // 根据网络质量设置预加载秒数
  preloadSeconds: {
    excellent: 60,  // 良好网络预加载60秒
    good: 30,       // 一般网络预加载30秒
    fair: 10,       // 较差网络预加载10秒
    poor: 0,        // 差网络不预加载
    offline: 0,
  },
  // 最大缓冲区 (MB)
  maxBufferSize: {
    excellent: 100,
    good: 50,
    fair: 20,
    poor: 10,
    offline: 0,
  },
  // 预加载策略
  preloadStrategy: {
    excellent: "auto" as PreloadStrategy,
    good: "auto" as PreloadStrategy,
    fair: "metadata" as PreloadStrategy,
    poor: "none" as PreloadStrategy,
    offline: "none" as PreloadStrategy,
  },
};

// ============================================
// 主 Hook
// ============================================
export function useStreamingOptimizer() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    quality: "good",
    downlink: 10,
    rtt: 50,
    effectiveType: "4g",
    saveData: false,
  });

  const [preloadConfig, setPreloadConfig] = useState<PreloadConfig>({
    strategy: "smart",
    preloadAhead: 30,
    maxBufferSize: 50,
    adaptiveBitrate: true,
  });

  const [recommendedBitrate, setRecommendedBitrate] = useState<number>(4000);
  const [currentBitrateLevel, setCurrentBitrateLevel] = useState<BitrateLevel>(DEFAULT_BITRATE_LEVELS[2]);
  
  const networkHistoryRef = useRef<number[]>([]);
  const lastBitrateChangeRef = useRef<number>(Date.now());
  const bitrateChangeCooldown = 5000; // 码率切换冷却时间 (ms)

  // ============================================
  // 检测网络状态
  // ============================================
  const detectNetworkQuality = useCallback((): NetworkStatus => {
    const nav = navigator as Navigator & {
      connection?: {
        downlink?: number;
        rtt?: number;
        effectiveType?: string;
        saveData?: boolean;
      };
    };

    const connection = nav.connection;
    
    if (!connection) {
      // 不支持 Network Information API，使用降级方案
      return {
        quality: "good",
        downlink: 10,
        rtt: 50,
        effectiveType: "4g",
        saveData: false,
      };
    }

    const downlink = connection.downlink || 10;
    const rtt = connection.rtt || 50;
    const effectiveType = connection.effectiveType || "4g";
    const saveData = connection.saveData || false;

    // 根据网络参数判断质量
    let quality: NetworkQuality = "good";
    
    if (saveData || downlink === 0) {
      quality = "offline";
    } else if (downlink >= 10 && rtt < 50) {
      quality = "excellent";
    } else if (downlink >= 5 && rtt < 100) {
      quality = "good";
    } else if (downlink >= 1 && rtt < 300) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    return {
      quality,
      downlink,
      rtt,
      effectiveType,
      saveData,
    };
  }, []);

  // ============================================
  // 更新网络状态
  // ============================================
  const updateNetworkStatus = useCallback(() => {
    const status = detectNetworkQuality();
    setNetworkStatus(status);

    // 更新推荐码率
    const recommendedBitrate = NETWORK_QUALITY_BITRATES[status.quality];
    setRecommendedBitrate(recommendedBitrate);

    // 找到最接近的码率等级
    const level = findClosestBitrateLevel(recommendedBitrate);
    setCurrentBitrateLevel(level);

    // 更新预加载配置
    if (preloadConfig.strategy === "smart") {
      setPreloadConfig(prev => ({
        ...prev,
        preloadAhead: SMART_PRELOAD_CONFIG.preloadSeconds[status.quality],
        maxBufferSize: SMART_PRELOAD_CONFIG.maxBufferSize[status.quality],
      }));
    }
  }, [detectNetworkQuality, preloadConfig.strategy]);

  // ============================================
  // 找到最接近的码率等级
  // ============================================
  const findClosestBitrateLevel = (bitrate: number): BitrateLevel => {
    if (bitrate === 0) return DEFAULT_BITRATE_LEVELS[DEFAULT_BITRATE_LEVELS.length - 1];
    
    return DEFAULT_BITRATE_LEVELS.reduce((prev, curr) => {
      return Math.abs(curr.bitrate - bitrate) < Math.abs(prev.bitrate - bitrate) ? curr : prev;
    });
  };

  // ============================================
  // 测量实际下载速度
  // =========================================>
  const measureDownloadSpeed = useCallback(async (testUrl: string): Promise<number> => {
    const startTime = performance.now();
    const testSize = 1024 * 1024; // 1MB test
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const speed = testSize / duration / 1024 / 1024; // Mbps
        
        // 记录历史
        networkHistoryRef.current.push(speed);
        if (networkHistoryRef.current.length > 5) {
          networkHistoryRef.current.shift();
        }
        
        return speed;
      }
    } catch {
      // 测量失败
    }
    
    return 0;
  }, []);

  // ============================================
  // 自适应码率调整
  // ============================================
  const adaptBitrate = useCallback((
    currentBufferHealth: number,  // 0-1, 缓冲区健康度
    recentDownloadSpeed: number,  // Mbps
    currentBitrate: number
  ): { newBitrate: number; shouldSwitch: boolean; reason: string } => {
    const now = Date.now();
    
    // 检查冷却时间
    if (now - lastBitrateChangeRef.current < bitrateChangeCooldown) {
      return { newBitrate: currentBitrate, shouldSwitch: false, reason: "冷却中" };
    }

    // 计算安全码率 (下载速度的 80%)
    const safeBitrate = recentDownloadSpeed * 0.8 * 1000; // kbps
    
    let newBitrate = currentBitrate;
    let shouldSwitch = false;
    let reason = "";

    // 缓冲区健康度低，需要降级
    if (currentBufferHealth < 0.2) {
      const lowerLevel = findLowerBitrateLevel(currentBitrate);
      if (lowerLevel.bitrate < currentBitrate) {
        newBitrate = lowerLevel.bitrate;
        shouldSwitch = true;
        reason = `缓冲区不足 (${(currentBufferHealth * 100).toFixed(0)}%)，降级到 ${lowerLevel.name}`;
      }
    }
    // 下载速度充足，可以升级
    else if (currentBufferHealth > 0.5 && safeBitrate > currentBitrate * 1.5) {
      const higherLevel = findHigherBitrateLevel(currentBitrate);
      if (higherLevel.bitrate > currentBitrate) {
        newBitrate = higherLevel.bitrate;
        shouldSwitch = true;
        reason = `网络良好，升级到 ${higherLevel.name}`;
      }
    }
    // 下载速度不足，需要降级
    else if (safeBitrate < currentBitrate * 0.8) {
      const lowerLevel = findLowerBitrateLevel(currentBitrate);
      if (lowerLevel.bitrate < currentBitrate) {
        newBitrate = lowerLevel.bitrate;
        shouldSwitch = true;
        reason = `下载速度不足，降级到 ${lowerLevel.name}`;
      }
    }

    if (shouldSwitch) {
      lastBitrateChangeRef.current = now;
    }

    return { newBitrate, shouldSwitch, reason };
  }, []);

  // ============================================
  // 找到更低的码率等级
  // ============================================
  const findLowerBitrateLevel = (currentBitrate: number): BitrateLevel => {
    const currentIndex = DEFAULT_BITRATE_LEVELS.findIndex(l => l.bitrate === currentBitrate);
    if (currentIndex === -1 || currentIndex === DEFAULT_BITRATE_LEVELS.length - 1) {
      return DEFAULT_BITRATE_LEVELS[DEFAULT_BITRATE_LEVELS.length - 1];
    }
    return DEFAULT_BITRATE_LEVELS[currentIndex + 1];
  };

  // ============================================
  // 找到更高的码率等级
  // ============================================
  const findHigherBitrateLevel = (currentBitrate: number): BitrateLevel => {
    const currentIndex = DEFAULT_BITRATE_LEVELS.findIndex(l => l.bitrate === currentBitrate);
    if (currentIndex <= 0) {
      return DEFAULT_BITRATE_LEVELS[0];
    }
    return DEFAULT_BITRATE_LEVELS[currentIndex - 1];
  };

  // ============================================
  // 获取预加载属性
  // ============================================
  const getPreloadAttribute = useCallback((): string => {
    switch (preloadConfig.strategy) {
      case "none":
        return "none";
      case "metadata":
        return "metadata";
      case "auto":
        return "auto";
      case "smart":
        return SMART_PRELOAD_CONFIG.preloadStrategy[networkStatus.quality];
      default:
        return "metadata";
    }
  }, [preloadConfig.strategy, networkStatus.quality]);

  // ============================================
  // 设置预加载策略
  // ============================================
  const setPreloadStrategy = useCallback((strategy: PreloadStrategy) => {
    setPreloadConfig(prev => ({
      ...prev,
      strategy,
      // 如果是 smart 模式，自动根据网络状态更新
      ...(strategy === "smart" ? {
        preloadAhead: SMART_PRELOAD_CONFIG.preloadSeconds[networkStatus.quality],
        maxBufferSize: SMART_PRELOAD_CONFIG.maxBufferSize[networkStatus.quality],
      } : {}),
    }));
  }, [networkStatus.quality]);

  // ============================================
  // 监听网络变化
  // ============================================
  useEffect(() => {
    updateNetworkStatus();

    const nav = navigator as Navigator & {
      connection?: {
        addEventListener?: (event: string, handler: () => void) => void;
        removeEventListener?: (event: string, handler: () => void) => void;
      };
    };

    const connection = nav.connection;
    
    if (connection?.addEventListener) {
      connection.addEventListener("change", updateNetworkStatus);
    }

    // 定期更新网络状态
    const intervalId = setInterval(updateNetworkStatus, 30000);

    return () => {
      if (connection?.removeEventListener) {
        connection.removeEventListener("change", updateNetworkStatus);
      }
      clearInterval(intervalId);
    };
  }, [updateNetworkStatus]);

  return {
    // 网络状态
    networkStatus,
    networkQuality: networkStatus.quality,
    
    // 预加载配置
    preloadConfig,
    preloadStrategy: preloadConfig.strategy,
    preloadAhead: preloadConfig.preloadAhead,
    maxBufferSize: preloadConfig.maxBufferSize,
    
    // 码率相关
    recommendedBitrate,
    currentBitrateLevel,
    bitrateLevels: DEFAULT_BITRATE_LEVELS,
    
    // 方法
    setPreloadStrategy,
    getPreloadAttribute,
    measureDownloadSpeed,
    adaptBitrate,
    updateNetworkStatus,
    findClosestBitrateLevel,
  };
}

export default useStreamingOptimizer;
