"use client";

import { useState, useEffect, useCallback } from "react";
import { gatewayApi, shareApi, downloadApi } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { useGatewayStore } from "@/lib/store";
import { copyToClipboard } from "@/lib/utils";
import { verifyFileIntegrity } from "@/lib/security";
import type { Gateway, FileRecord } from "@/types";

interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
  password?: string;
  expiry?: string;
  hasPassword: boolean;
}

export function useSharePage(cid: string) {
  const { customGateways } = useGatewayStore();

  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isTestingGateways, setIsTestingGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);
  const [isSmartSelecting, setIsSmartSelecting] = useState(false);
  const [gatewayTestStatus, setGatewayTestStatus] = useState<
    Map<string, "pending" | "testing" | "success" | "failed">
  >(new Map());

  // 获取所有网关
  const getAllGateways = useCallback(async () => {
    const allGateways = [...CONFIG.DEFAULT_GATEWAYS];

    try {
      const publicGateways = await gatewayApi.fetchPublicGateways();
      publicGateways.forEach((publicGateway) => {
        if (!allGateways.find((g) => g.url === publicGateway.url)) {
          allGateways.push(publicGateway);
        }
      });
    } catch {
      console.warn("获取公共网关列表失败，使用默认网关");
    }

    customGateways.forEach((custom) => {
      if (!allGateways.find((g) => g.url === custom.url)) {
        allGateways.push(custom);
      }
    });

    return allGateways;
  }, [customGateways]);

  // 加载分享信息
  useEffect(() => {
    if (!cid) return;

    const loadShareInfo = async () => {
      try {
        const info = await shareApi.getShareInfo(cid);
        if (info) {
          setShareInfo({
            cid: info.cid,
            filename: info.filename,
            size: info.size,
            hasPassword: info.hasPassword,
            expiry: info.expiry,
          });
          setIsAuthenticated(!info.hasPassword);
        } else {
          // 向后兼容：从 localStorage 获取
          const storedShares = localStorage.getItem("crustshare_shares");
          if (storedShares) {
            const shares = JSON.parse(storedShares);
            const share = shares.find((s: any) => s.cid === cid);
            if (share) {
              setShareInfo({
                cid,
                filename: share.filename,
                size: share.size,
                password: share.password,
                expiry: share.expiry,
                hasPassword: !!share.password,
              });
              setIsAuthenticated(!share.password);
            } else {
              setShareInfo({ cid, hasPassword: false });
              setIsAuthenticated(true);
            }
          } else {
            setShareInfo({ cid, hasPassword: false });
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("获取分享信息失败:", error);
        setShareInfo({ cid, hasPassword: false });
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadShareInfo();
  }, [cid]);

  // 测试网关
  const testGateways = useCallback(async (forceRefresh = false) => {
    setIsTestingGateways(true);
    try {
      // 如果强制刷新，清除缓存
      if (forceRefresh) {
        localStorage.removeItem(CONFIG.GATEWAY_TEST.CHECK_CACHE_KEY);
      }

      const allGateways = await getAllGateways();
      const results = await gatewayApi.testAllGateways(allGateways);
      setGateways(results);
      gatewayApi.cacheResults(results);

      const availableGateways = results.filter((g) => g.available);
      if (availableGateways.length > 0) {
        const best = availableGateways.sort(
          (a, b) => (a.latency || Infinity) - (b.latency || Infinity)
        )[0];
        setSelectedGateway(best);
      }
    } catch (error) {
      console.error("网关测试失败:", error);
    } finally {
      setIsTestingGateways(false);
    }
  }, [getAllGateways]);

  // 初始化网关
  useEffect(() => {
    const cached = gatewayApi.getCachedResults();
    if (cached && cached.length > 0) {
      setGateways(cached);
      const availableGateways = cached.filter((g) => g.available);
      if (availableGateways.length > 0) {
        const best = availableGateways.sort(
          (a, b) => (a.latency || Infinity) - (b.latency || Infinity)
        )[0];
        setSelectedGateway(best);
      }
    } else {
      testGateways();
    }
  }, [testGateways]);

  // 验证密码
  const handleVerifyPassword = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const result = await shareApi.verifyPassword(cid, password);
        if (result) {
          setShareInfo({
            cid: result.cid,
            filename: result.filename,
            size: result.size,
            hasPassword: result.hasPassword,
            expiry: result.expiry,
          });
          setIsAuthenticated(true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [cid]
  );

  // 复制 CID
  const handleCopyCid = useCallback(async () => {
    const success = await copyToClipboard(cid);
    if (success) {
      setCopiedCid(true);
      setTimeout(() => setCopiedCid(false), 2000);
    }
  }, [cid]);

  // 下载文件
  const handleDownload = useCallback(async () => {
    if (!selectedGateway) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const result = await downloadApi.downloadFile(
        cid,
        shareInfo?.filename || `file-${cid.slice(0, 8)}`,
        selectedGateway,
        undefined, // 分享页面可能没有存储的 hash
        (progress) => setDownloadProgress(progress)
      );

      if (result.success && result.blob) {
        downloadApi.triggerDownload(result.blob, shareInfo?.filename || `file-${cid.slice(0, 8)}`);
        setDownloadProgress(100);
      } else {
        // 如果下载失败，回退到直接链接下载
        const url = `${selectedGateway.url}${cid}`;
        const link = document.createElement("a");
        link.href = url;
        link.download = shareInfo?.filename || `file-${cid.slice(0, 8)}`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // 出错时回退到直接链接下载
      const url = `${selectedGateway.url}${cid}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = shareInfo?.filename || `file-${cid.slice(0, 8)}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    }
  }, [cid, selectedGateway, shareInfo?.filename]);

  // 智能下载
  const handleSmartDownload = useCallback(async () => {
    if (gateways.length === 0) {
      alert("暂无可用网关，请先检测网关");
      return;
    }

    setIsSmartSelecting(true);
    setGatewayTestStatus(new Map());

    try {
      const result = await gatewayApi.multiGatewayDownload(
        cid,
        gateways,
        (gateway, status) => {
          setGatewayTestStatus((prev) => new Map(prev).set(gateway.name, status));
        }
      );

      if (result) {
        setSelectedGateway(result.gateway);

        setIsDownloading(true);
        setDownloadProgress(0);

        const progressInterval = setInterval(() => {
          setDownloadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const link = document.createElement("a");
        link.href = result.url;
        link.download = shareInfo?.filename || `file-${cid.slice(0, 8)}`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          clearInterval(progressInterval);
          setDownloadProgress(100);
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
          }, 1000);
        }, 2000);
      } else {
        alert("无法找到可用网关，请手动选择");
      }
    } catch (error) {
      console.error("智能下载失败:", error);
      alert("智能下载失败，请手动选择网关");
    } finally {
      setIsSmartSelecting(false);
    }
  }, [cid, gateways, shareInfo?.filename]);

  // 在 IPFS 中打开
  const handleOpenInIpfs = useCallback(() => {
    window.open(`ipfs://${cid}`, "_blank");
  }, [cid]);

  return {
    shareInfo,
    gateways,
    isTestingGateways,
    selectedGateway,
    isAuthenticated,
    isLoading,
    downloadProgress,
    isDownloading,
    copiedCid,
    isSmartSelecting,
    gatewayTestStatus,
    setSelectedGateway,
    testGateways,
    handleVerifyPassword,
    handleCopyCid,
    handleDownload,
    handleSmartDownload,
    handleOpenInIpfs,
  };
}
