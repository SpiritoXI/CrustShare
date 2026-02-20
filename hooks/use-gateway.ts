/**
 * 网关管理 Hook
 * 处理 IPFS 网关的测试、选择和配置
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { gatewayApi } from "@/lib/api";
import { useGatewayStore, useUIStore } from "@/lib/store";
import { handleError } from "@/lib/utils/error";
import type { Gateway, GatewayTestProgress, GatewayFilter, GatewaySortField, GatewaySortOrder, GatewayHealthTrend } from "@/types";

export interface GatewayState {
  gateways: Gateway[];
  customGateways: Gateway[];
  isTesting: boolean;
  isFetchingPublic: boolean;
  lastTestTime: number | null;
  testProgress: GatewayTestProgress | null;
  healthTrends: Record<string, GatewayHealthTrend>;
}

export interface GatewayOperations {
  testGateways: (forceRefresh?: boolean) => Promise<void>;
  cancelTest: () => void;
  fetchPublicGateways: () => Promise<void>;
  addCustomGateway: (gateway: Omit<Gateway, 'icon' | 'priority'>) => Promise<{ success: boolean; message: string }>;
  removeCustomGateway: (name: string) => void;
  getBestGateway: () => Gateway | null;
  getAvailableGateways: () => Gateway[];
  filterGateways: (filter: GatewayFilter) => Gateway[];
  sortGateways: (field: GatewaySortField, order?: GatewaySortOrder) => void;
  getGatewayHealthTrend: (name: string) => GatewayHealthTrend | null;
  testSingleGateway: (gateway: Gateway) => Promise<Gateway>;
  validateGatewayUrl: (url: string) => { valid: boolean; normalizedUrl: string; error?: string };
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
  const [testProgress, setTestProgress] = useState<GatewayTestProgress | null>(null);
  const [healthTrends, setHealthTrends] = useState<Record<string, GatewayHealthTrend>>({});
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const sortFieldRef = useRef<GatewaySortField>('healthScore');
  const sortOrderRef = useRef<GatewaySortOrder>('asc');

  const testGateways = useCallback(async (forceRefresh: boolean = false) => {
    if (isTesting) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsTesting(true);
    setStoreIsTesting(true);
    showToast("开始测试网关...", "info");

    try {
      const results = await gatewayApi.testAllGatewaysWithProgress(
        gateways.length > 0 ? gateways : customGateways,
        {
          onOverallProgress: (progress) => {
            setTestProgress({ ...progress });
          },
          signal: abortController.signal,
        }
      );
      
      if (abortController.signal.aborted) {
        showToast("网关测试已取消", "warning");
        return;
      }
      
      setGateways(results);
      const now = Date.now();
      setLastTestTime(now);
      setStoreLastTestTime(now);

      const availableCount = results.filter(g => g.available).length;
      const highQualityCount = results.filter(g => g.available && (g.healthScore || 0) >= 70).length;

      const trends = gatewayApi.loadHealthTrends();
      setHealthTrends(trends);

      showToast(
        `网关测试完成，${availableCount} 个可用，${highQualityCount} 个高质量`,
        "success"
      );
    } catch (error) {
      if (abortController.signal.aborted) {
        showToast("网关测试已取消", "warning");
        return;
      }
      handleError(error, { showToast });
    } finally {
      setIsTesting(false);
      setStoreIsTesting(false);
      setTestProgress(null);
      abortControllerRef.current = null;
    }
  }, [gateways, customGateways, isTesting, setGateways, setStoreIsTesting, setStoreLastTestTime, showToast]);
  
  const cancelTest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTesting(false);
      setStoreIsTesting(false);
      setTestProgress(null);
      showToast("正在取消网关测试...", "warning");
    }
  }, [setStoreIsTesting, showToast]);

  const fetchPublicGateways = useCallback(async () => {
    if (isFetchingPublic) return;
    
    setIsFetchingPublic(true);
    showToast("正在获取公共网关列表...", "info");

    try {
      const publicGateways = await gatewayApi.fetchPublicGateways();
      
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

  const validateGatewayUrl = useCallback((url: string) => {
    return gatewayApi.validateGatewayUrl(url);
  }, []);

  const addCustomGateway = useCallback(async (gateway: Omit<Gateway, 'icon' | 'priority'>) => {
    try {
      const validation = gatewayApi.validateGatewayUrl(gateway.url);
      if (!validation.valid) {
        showToast(validation.error || "URL 格式无效", "error");
        return { success: false, message: validation.error || "URL 格式无效" };
      }

      const normalizedUrl = validation.normalizedUrl;
      const exists = [...gateways, ...customGateways].some(g => g.url === normalizedUrl);
      if (exists) {
        showToast("该网关已存在", "error");
        return { success: false, message: "该网关已存在" };
      }

      showToast("正在测试网关连接...", "info");

      const connectivity = await gatewayApi.checkGatewayConnectivity(normalizedUrl);
      if (!connectivity.reachable) {
        showToast("网关无法连接，请检查URL是否正确", "warning");
      }

      const testResult = await gatewayApi.testGateway({
        ...gateway,
        url: normalizedUrl,
      } as Gateway, {
        retries: 2,
        samples: 3,
      });

      const newGateway: Gateway = {
        ...gateway,
        url: normalizedUrl,
        icon: "🌐",
        priority: 100 + customGateways.length,
        available: testResult.available,
        latency: testResult.latency,
        reliability: testResult.reliability,
        corsEnabled: testResult.corsEnabled,
        rangeSupport: testResult.rangeSupport,
        healthScore: testResult.available ? 70 : 20,
        lastChecked: Date.now(),
      };

      addToStore(newGateway);
      setGateways([...gateways, newGateway]);

      const message = testResult.available
        ? `网关添加成功，延迟 ${testResult.latency}ms，可靠性 ${testResult.reliability}%`
        : "网关添加成功，但当前不可用";

      showToast(message, testResult.available ? "success" : "warning");
      return { success: true, message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "添加网关失败";
      handleError(error, { showToast });
      return { success: false, message: errorMessage };
    }
  }, [gateways, customGateways, addToStore, setGateways, showToast]);

  const removeCustomGateway = useCallback((name: string) => {
    removeFromStore(name);
    setGateways(gateways.filter(g => g.name !== name));
    showToast("网关已移除", "success");
  }, [gateways, removeFromStore, setGateways, showToast]);

  const testSingleGateway = useCallback(async (gateway: Gateway): Promise<Gateway> => {
    showToast(`正在测试 ${gateway.name}...`, "info");
    
    try {
      const testResult = await gatewayApi.testGateway(gateway);
      
      const result: Gateway = {
        ...gateway,
        available: testResult.available,
        latency: testResult.latency,
        reliability: testResult.reliability,
        healthScore: testResult.healthScore,
        rangeSupport: testResult.rangeSupport,
        corsEnabled: testResult.corsEnabled,
        lastChecked: Date.now(),
      };
      
      const updatedGateways = gateways.map(g => 
        g.url === gateway.url ? result : g
      );
      setGateways(updatedGateways);
      
      showToast(
        result.available 
          ? `${gateway.name} 可用，延迟 ${result.latency}ms`
          : `${gateway.name} 不可用`,
        result.available ? "success" : "warning"
      );
      
      return result;
    } catch (error) {
      handleError(error, { showToast });
      return gateway;
    }
  }, [gateways, setGateways, showToast]);

  const getBestGateway = useCallback((): Gateway | null => {
    const available = [...customGateways, ...gateways].filter(g => g.available);
    if (available.length === 0) return null;

    return available.sort((a, b) => {
      const healthDiff = (b.healthScore || 0) - (a.healthScore || 0);
      if (healthDiff !== 0) return healthDiff;

      const reliabilityDiff = (b.reliability || 0) - (a.reliability || 0);
      if (reliabilityDiff !== 0) return reliabilityDiff;

      return (a.latency || Infinity) - (b.latency || Infinity);
    })[0];
  }, [gateways, customGateways]);

  const getAvailableGateways = useCallback((): Gateway[] => {
    return [...customGateways, ...gateways].filter(g => g.available);
  }, [gateways, customGateways]);

  const filterGateways = useCallback((filter: GatewayFilter): Gateway[] => {
    const allGateways = [...customGateways, ...gateways];
    return gatewayApi.filterGateways(allGateways, filter);
  }, [gateways, customGateways]);

  const sortGateways = useCallback((field: GatewaySortField, order: GatewaySortOrder = 'asc') => {
    sortFieldRef.current = field;
    sortOrderRef.current = order;
    
    const sorted = gatewayApi.sortGateways(gateways, field, order);
    setGateways(sorted);
  }, [gateways, setGateways]);

  const getGatewayHealthTrend = useCallback((name: string): GatewayHealthTrend | null => {
    return healthTrends[name] || null;
  }, [healthTrends]);

  useEffect(() => {
    const init = async () => {
      const trends = gatewayApi.loadHealthTrends();
      setHealthTrends(trends);

      const cached = gatewayApi.getCachedResults();
      if (cached && cached.length > 0) {
        const cachedUrls = new Set(cached.map(g => g.url));
        const defaultUrls = gateways.map(g => g.url);
        const hasAllDefaults = defaultUrls.every(url => cachedUrls.has(url));

        const cacheAge = Date.now() - (cached[0]?.lastChecked || 0);
        const cacheExpired = cacheAge > 5 * 60 * 1000;

        if (hasAllDefaults && !cacheExpired) {
          setGateways(cached);
          const availableCount = cached.filter(g => g.available).length;
          if (availableCount > 0) {
            return;
          }
        }
      }

      await testGateways();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    gateways,
    customGateways,
    isTesting,
    isFetchingPublic,
    lastTestTime,
    testProgress,
    healthTrends,
    testGateways,
    cancelTest,
    fetchPublicGateways,
    addCustomGateway,
    removeCustomGateway,
    getBestGateway,
    getAvailableGateways,
    filterGateways,
    sortGateways,
    getGatewayHealthTrend,
    testSingleGateway,
    validateGatewayUrl,
  };
}
