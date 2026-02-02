"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, ExternalLink, Copy, Check, ArrowLeft, File, Globe, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, copyToClipboard } from "@/lib/utils";
import { api, gatewayApi, shareApi } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import type { Gateway } from "@/types";

interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
}

interface GatewayLink {
  gateway: Gateway;
  url: string;
  status: "pending" | "testing" | "success" | "failed";
  latency?: number;
}

declare global {
  interface Window {
    __DOWNLOAD_CID__?: string;
    __DOWNLOAD_FILENAME__?: string;
    __DOWNLOAD_SIZE__?: string;
  }
}

export default function DownloadPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  // 优先从全局变量获取 CID（Cloudflare Function 注入），否则从 URL 参数获取
  const urlCid = params.cid as string;
  const globalCid = typeof window !== 'undefined' ? window.__DOWNLOAD_CID__ : undefined;
  const cid = (globalCid && globalCid !== '[[cid]]' ? globalCid : urlCid) || '';

  // 优先从全局变量获取文件名和大小
  const globalFilename = typeof window !== 'undefined' ? window.__DOWNLOAD_FILENAME__ : undefined;
  const globalSize = typeof window !== 'undefined' ? window.__DOWNLOAD_SIZE__ : undefined;

  const filename = globalFilename || searchParams.get("filename") || "";
  const sizeParam = globalSize || searchParams.get("size");
  const size = sizeParam ? parseInt(sizeParam, 10) : undefined;

  const [shareInfo, setShareInfo] = useState<ShareInfo>({ cid, filename, size });
  const [gatewayLinks, setGatewayLinks] = useState<GatewayLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 加载分享信息和网关
  useEffect(() => {
    if (!cid) return;

    const loadData = async () => {
      setIsLoading(true);

      let fileInfo: ShareInfo = { cid, filename, size };

      // 尝试从API获取分享信息
      try {
        const info = await shareApi.getShareInfo(cid);
        if (info) {
          fileInfo = {
            cid: info.cid,
            filename: info.filename || fileInfo.filename,
            size: info.size ?? fileInfo.size,
          };
        }
      } catch {
        console.warn("获取分享信息失败，使用URL参数");
      }

      // 如果API没有返回文件名或大小，尝试从IPFS网关获取
      if (!fileInfo.filename || !fileInfo.size) {
        try {
          const cidInfo = await api.fetchCidInfo(cid);
          if (cidInfo && cidInfo.valid) {
            fileInfo = {
              ...fileInfo,
              filename: fileInfo.filename || cidInfo.name,
              size: fileInfo.size || cidInfo.size,
            };
          }
        } catch {
          console.warn("从IPFS网关获取文件信息失败");
        }
      }

      // 更新文件信息状态
      setShareInfo(fileInfo);

      // 获取网关列表
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

      // 初始化网关链接状态
      const links = allGateways.map((gateway) => ({
        gateway,
        url: `${gateway.url}${cid}`,
        status: "pending" as const,
      }));
      setGatewayLinks(links);

      // 网关列表已加载完成，关闭加载状态
      setIsLoading(false);

      // 在后台测试网关可用性（不阻塞UI）
      testGateways(links);
    };

    loadData();
  }, [cid]);

  // 测试单个网关 - 带超时保护
  const testSingleGateway = async (link: GatewayLink, index: number, abortSignal: AbortSignal): Promise<void> => {
    // 如果已取消，直接返回
    if (abortSignal.aborted) {
      setGatewayLinks((prev) =>
        prev.map((l, i) => (i === index ? { ...l, status: "failed" } : l))
      );
      return;
    }

    setGatewayLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, status: "testing" } : l))
    );

    const startTime = Date.now();
    try {
      const result = await gatewayApi.testGateway(link.gateway, {
        signal: abortSignal,
      });
      const latency = Date.now() - startTime;

      // 再次检查是否已取消
      if (abortSignal.aborted) {
        setGatewayLinks((prev) =>
          prev.map((l, i) => (i === index ? { ...l, status: "failed" } : l))
        );
        return;
      }

      setGatewayLinks((prev) =>
        prev.map((l, i) =>
          i === index
            ? {
                ...l,
                status: result.available ? "success" : "failed",
                latency: result.latency || latency,
              }
            : l
        )
      );
    } catch {
      setGatewayLinks((prev) =>
        prev.map((l, i) => (i === index ? { ...l, status: "failed" } : l))
      );
    }
  };

  // 测试所有网关 - 使用 AbortController 确保可以取消
  const testGateways = async (links: GatewayLink[]) => {
    setIsTesting(true);
    const abortController = new AbortController();

    // 设置总体超时 - 15秒后自动取消
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 15000);

    try {
      const testPromises = links.map((link, index) =>
        testSingleGateway(link, index, abortController.signal)
      );
      await Promise.all(testPromises);
    } finally {
      clearTimeout(timeoutId);
      setIsTesting(false);
    }
  };

  // 复制链接
  const handleCopyUrl = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  // 刷新网关测试
  const handleRefresh = () => {
    const resetLinks = gatewayLinks.map((link) => ({
      ...link,
      status: "pending" as const,
      latency: undefined,
    }));
    setGatewayLinks(resetLinks);
    testGateways(resetLinks);
  };

  // 按可用性和延迟排序
  const sortedLinks = [...gatewayLinks].sort((a, b) => {
    if (a.status === "success" && b.status !== "success") return -1;
    if (a.status !== "success" && b.status === "success") return 1;
    if (a.latency && b.latency) return a.latency - b.latency;
    if (a.latency) return -1;
    if (b.latency) return 1;
    return 0;
  });

  const availableCount = gatewayLinks.filter((l) => l.status === "success").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 头部 */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Download className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              CrustShare
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 文件信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <File className="h-5 w-5 text-blue-500" />
                <span>文件信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">文件名</p>
                  <p className="font-medium break-all">
                    {shareInfo.filename || "未知文件名"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">文件大小</p>
                  <p className="font-medium">
                    {shareInfo.size ? formatFileSize(shareInfo.size) : "未知大小"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">CID</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm break-all flex-1">
                    {cid}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyUrl(cid)}
                  >
                    {copiedUrl === cid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 网关列表 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span>下载网关</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {availableCount}/{gatewayLinks.length} 可用
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isTesting}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? '检测中...' : '刷新'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    正在加载网关列表...
                  </div>
                ) : sortedLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无可用网关，请点击刷新按钮重试
                  </div>
                ) : (
                  <>
                    {isTesting && (
                      <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        正在检测网关可用性...
                      </div>
                    )}
                    {sortedLinks.map((link, index) => (
                  <motion.div
                    key={link.gateway.url}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      link.status === "success"
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : link.status === "failed"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-60"
                        : link.status === "testing"
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-xl">{link.gateway.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{link.gateway.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {link.gateway.region === "CN" ? "国内" : "国际"}
                          {link.latency && link.status === "success" && ` · ${link.latency}ms`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {link.status === "testing" && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          检测中...
                        </span>
                      )}
                      {link.status === "success" && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          可用
                        </span>
                      )}
                      {link.status === "failed" && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          不可用
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(link.url)}
                        disabled={link.status !== "success"}
                      >
                        {copiedUrl === link.url ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant={link.status === "success" ? "default" : "outline"}
                        size="sm"
                        asChild
                        disabled={link.status !== "success"}
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          下载
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ))}
                </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
