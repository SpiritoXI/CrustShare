/**
 * 网关管理 Hook
 * 处理 IPFS 网关的测试、选择和配置
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { gatewayApi } from "@/lib/api";
import { useGatewayStore, useUIStore } from "@/lib/store";
import { handleError } from "@/lib/error-handler";
import type { Gateway } from "@/types";

export interface GatewayState {
  gateways: Gateway[];
  customGateways: Gateway[];
  isTesting: boolean;
  isFetchingPublic: boolean;
  lastTestTime: number | null;
}

export interface GatewayOperations {
  testGateways: () => Promise<void>;
  fetchPublicGateways: () => Promise<void>;
  addCustomGateway: (gateway: Omit<Gateway, 'icon' | 'priority'>) => Promise<void>;
  removeCustomGateway: (name: string) => void;
  getBestGateway: () => Gateway | null;
  getAvailableGateways: () => Gateway[];
}

export function useGateway(): GatewayState & GatewayOperations {
  const { 
    gateways, 
    customGateways, 
    setGateways, 
    addCustomGateway: addToStore, 
    removeCustomGateway: removeFromStore,
    setIsTesting: setStoreIsTesting,
    setLastTestTime: setStoreLastTestTime
  } = useGatewayStore();
  const { showToast } = useUIStore();
  
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingPublic, setIsFetchingPublic] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<number | null>(null);

  // 测试所有网关
  const testGateways = useCallback(async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    setStoreIsTesting(true);
    showToast("开始测试网关...", "info");

    try {
      const results = await gatewayApi.autoTestGateways(customGateways);
      setGateways(results);
      const now = Date.now();
      setLastTestTime(now);
      setStoreLastTestTime(now);
      
      const availableCount = results.filter(g => g.available).length;
      showToast(`网关测试完成，${availableCount} 个可用`, "success");
    } catch (error) {
      handleError(error, { showToast });
    } finally {
      setIsTesting(false);
      setStoreIsTesting(false);
    }
  }, [customGateways, isTesting, setGateways, setStoreIsTesting, setStoreLastTestTime, showToast]);

  // 获取公共网关列表
  const fetchPublicGateways = useCallback(async () => {
    if (isFetchingPublic) return;
    
    setIsFetchingPublic(true);
    showToast("正在获取公共网关列表...", "info");

    try {
      const publicGateways = await gatewayApi.fetchPublicGateways();
      
      // 合并现有网关和公共网关
      const existingUrls = new Set(gateways.map(g => g.url));
      const newGateways = publicGateways.filter(g => !existingUrls.has(g.url));
      
      if (newGateways.length > 0) {
        const allGateways = [...gateways, ...newGateways];
        setGateways(allGateways);
        showToast(`已添加 ${newGateways.length} 个公共网关`, "success");
      } else {
        showToast("已是最新网关列表", "info");
      }
    } catch (error) {
      handleError(error, { showToast });
    } finally {
      setIsFetchingPublic(false);
    }
  }, [gateways, isFetchingPublic, setGateways, showToast]);

  // 添加自定义网关
  const addCustomGateway = useCallback(async (gateway: Omit<Gateway, 'icon' | 'priority'>) => {
    try {
      // 检查是否已存在
      const exists = [...gateways, ...customGateways].some(g => g.url === gateway.url);
      if (exists) {
        showToast("该网关已存在", "error");
        return;
      }

      // 测试新网关
      const testResult = await gatewayApi.testGateway(gateway as Gateway);
      
      const newGateway: Gateway = {
        ...gateway,
        icon: "🌐",
        priority: 100 + customGateways.length,
        available: testResult.available,
        latency: testResult.latency,
        lastChecked: Date.now(),
      };

      addToStore(newGateway);
      
      // 更新网关列表
      setGateways([...gateways, newGateway]);
      
      showToast(
        testResult.available 
          ? `网关添加成功，延迟 ${testResult.latency}ms` 
          : "网关添加成功，但当前不可用",
        testResult.available ? "success" : "warning"
      );
    } catch (error) {
      handleError(error, { showToast });
    }
  }, [gateways, customGateways, addToStore, setGateways, showToast]);

  // 移除自定义网关
  const removeCustomGateway = useCallback((name: string) => {
    removeFromStore(name);
    setGateways(gateways.filter(g => g.name !== name));
    showToast("网关已移除", "success");
  }, [gateways, removeFromStore, setGateways, showToast]);

  // 获取最佳网关
  const getBestGateway = useCallback((): Gateway | null => {
    const available = [...customGateways, ...gateways].filter(g => g.available);
    if (available.length === 0) return null;
    
    return available.reduce((best, current) => 
      (current.latency || Infinity) < (best.latency || Infinity) ? current : best
    );
  }, [gateways, customGateways]);

  // 获取可用网关列表
  const getAvailableGateways = useCallback((): Gateway[] => {
    return [...customGateways, ...gateways].filter(g => g.available);
  }, [gateways, customGateways]);

  // 初始化时自动测试网关
  useEffect(() => {
    const init = async () => {
      // 检查缓存
      const cached = gatewayApi.getCachedResults();
      if (cached && cached.length > 0) {
        setGateways(cached);
        const availableCount = cached.filter(g => g.available).length;
        if (availableCount > 0) {
          return; // 有可用网关，不需要重新测试
        }
      }
      
      // 自动测试网关
      await testGateways();
    };

    init();
  }, []);

  return {
    // 状态
    gateways,
    customGateways,
    isTesting,
    isFetchingPublic,
    lastTestTime,
    // 操作
    testGateways,
    fetchPublicGateways,
    addCustomGateway,
    removeCustomGateway,
    getBestGateway,
    getAvailableGateways,
  };
}
