"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, ExternalLink, Copy, Check, ArrowLeft, File, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, copyToClipboard } from "@/lib/utils";
import { gatewayApi, shareApi } from "@/lib/api";
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

  // 加载分享信息和网关
  useEffect(() => {
    if (!cid) return;

    const loadData = async () => {
      setIsLoading(true);

      // 尝试从API获取分享信息
      try {
        const info = await shareApi.getShareInfo(cid);
        if (info) {
          setShareInfo({
            cid: info.cid,
            filename: info.filename,
            size: info.size,
          });
        }
      } catch {
        console.warn("获取分享信息失败，使用URL参数");
      }

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

      // 测试网关可用性
      testGateways(links);

      setIsLoading(false);
    };

    loadData();
  }, [cid]);

  // 测试网关
  const testGateways = async (links: GatewayLink[]) => {
    const testPromises = links.map(async (link, index) => {
      setGatewayLinks((prev) =>
        prev.map((l, i) => (i === index ? { ...l, status: "testing" } : l))
      );

      const startTime = Date.now();
      try {
        const result = await gatewayApi.testGateway(link.gateway);
        const latency = Date.now() - startTime;

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
    });

    await Promise.all(testPromises);
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

          {/* 下载链接卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  <span>下载链接</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {availableCount}/{gatewayLinks.length} 可用
                  </span>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <Clock className="h-4 w-4 mr-1" />
                    刷新
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">正在检测网关...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedLinks.map((link, index) => (
                    <motion.div
                      key={link.gateway.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border ${
                        link.status === "success"
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : link.status === "failed"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-60"
                          : link.status === "testing"
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{link.gateway.icon}</span>
                          <div>
                            <p className="font-medium text-sm">
                              {link.gateway.name}
                              {index === 0 && link.status === "success" && (
                                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                                  推荐
                                </span>
                              )}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{link.gateway.region}</span>
                              {link.latency && (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-0.5" />
                                  {link.latency}ms
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {link.status === "testing" && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
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
                            size="sm"
                            onClick={() => window.open(link.url, "_blank")}
                            disabled={link.status !== "success"}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            下载
                          </Button>
                        </div>
                      </div>

                      {/* 链接显示 */}
                      {link.status === "success" && (
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                          <code className="text-xs text-green-700 dark:text-green-300 break-all">
                            {link.url}
                          </code>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 提示信息 */}
          <div className="text-center text-sm text-muted-foreground">
            <p>如果某个网关无法下载，请尝试其他网关链接</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
