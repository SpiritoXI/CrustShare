"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  File,
  Download,
  Globe,
  Check,
  AlertCircle,
  Clock,
  Lock,
  ExternalLink,
  RefreshCw,
  Copy,
  CheckCircle2,
  Server,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { gatewayApi } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { useGatewayStore } from "@/lib/store";
import { formatFileSize, copyToClipboard } from "@/lib/utils";
import type { Gateway } from "@/types";

interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
  password?: string;
  expiry?: string;
  hasPassword: boolean;
}

// 加载状态组件
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">加载中...</p>
      </motion.div>
    </div>
  );
}

// 静态生成占位符
function StaticPlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">分享页面</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">请通过分享链接访问</p>
      </div>
    </div>
  );
}

// 主要内容组件
function SharePageContent({ cid }: { cid: string }) {
  const { customGateways } = useGatewayStore();

  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isTestingGateways, setIsTestingGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [password, setPassword] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedCid, setCopiedCid] = useState(false);

  // 获取所有网关（默认 + 自定义）
  const getAllGateways = () => {
    const allGateways = [...CONFIG.DEFAULT_GATEWAYS];
    customGateways.forEach(custom => {
      if (!allGateways.find(g => g.url === custom.url)) {
        allGateways.push(custom);
      }
    });
    return allGateways;
  };

  // 从localStorage获取分享信息
  useEffect(() => {
    if (!cid) return;

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
        setShareInfo({
          cid,
          hasPassword: false,
        });
        setIsAuthenticated(true);
      }
    } else {
      setShareInfo({
        cid,
        hasPassword: false,
      });
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [cid]);

  // 测试网关
  const testGateways = async () => {
    setIsTestingGateways(true);
    try {
      const allGateways = getAllGateways();
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
  };

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
  }, []);

  const handleVerifyPassword = () => {
    if (!shareInfo?.password) {
      setIsAuthenticated(true);
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError("");

    setTimeout(() => {
      if (password === shareInfo.password) {
        setIsAuthenticated(true);
      } else {
        setPasswordError("密码错误，请重试");
      }
      setIsVerifyingPassword(false);
    }, 500);
  };

  const handleCopyCid = async () => {
    const success = await copyToClipboard(cid);
    if (success) {
      setCopiedCid(true);
      setTimeout(() => setCopiedCid(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!selectedGateway) {
      alert("请先选择一个可用的网关");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const url = `${selectedGateway.url}${cid}`;

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
      link.href = url;
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
    } catch (error) {
      console.error("下载失败:", error);
      alert("下载失败，请尝试其他网关");
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleOpenInIpfs = () => {
    if (!cid) return;
    window.open(`ipfs://${cid}`, "_blank");
  };

  if (isLoading || !cid) {
    return <LoadingState />;
  }

  if (!isAuthenticated && shareInfo?.hasPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              需要密码访问
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              此分享已设置密码保护
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="请输入访问密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                className={passwordError ? "border-red-500" : ""}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              onClick={handleVerifyPassword}
              disabled={isVerifyingPassword || !password}
              className="w-full"
            >
              {isVerifyingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  验证密码
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              CID: {cid.slice(0, 16)}...{cid.slice(-8)}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                CrustShare
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                去中心化文件分享
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <File className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 break-all">
                    {shareInfo?.filename || `文件-${cid.slice(0, 16)}...`}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    {shareInfo?.size && (
                      <span className="flex items-center">
                        <Server className="h-4 w-4 mr-1" />
                        {formatFileSize(shareInfo.size)}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      CID: {cid.slice(0, 12)}...{cid.slice(-6)}
                    </span>
                    {shareInfo?.expiry && (
                      <span className="flex items-center text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        有效期: {shareInfo.expiry}天
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <code className="flex-1 bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 break-all">
                      {cid}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCid}
                    >
                      {copiedCid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                下载文件
              </h3>

              {selectedGateway ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {selectedGateway.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {selectedGateway.latency}ms · {selectedGateway.region}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
                      推荐
                    </span>
                  </div>

                  {isDownloading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          下载进度
                        </span>
                        <span className="text-slate-900 dark:text-white">
                          {downloadProgress}%
                        </span>
                      </div>
                      <Progress value={downloadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex-1"
                      size="lg"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          下载中...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          立即下载
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleOpenInIpfs}
                      size="lg"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      IPFS打开
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    暂无可用网关，请刷新重试
                  </p>
                  <Button onClick={testGateways} disabled={isTestingGateways}>
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isTestingGateways ? "animate-spin" : ""
                      }`}
                    />
                    {isTestingGateways ? "检测中..." : "重新检测"}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  网关选择
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testGateways}
                  disabled={isTestingGateways}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isTestingGateways ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gateways.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <WifiOff className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">暂无网关数据</p>
                  </div>
                ) : (
                  gateways.map((gateway) => (
                    <button
                      key={gateway.name}
                      onClick={() =>
                        gateway.available && setSelectedGateway(gateway)
                      }
                      disabled={!gateway.available}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        selectedGateway?.name === gateway.name
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : gateway.available
                          ? "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                          : "border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {gateway.available ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                              {gateway.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {gateway.region}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {gateway.available ? (
                            <>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                {gateway.latency}ms
                              </p>
                              <p className="text-xs text-green-500">可用</p>
                            </>
                          ) : (
                            <p className="text-xs text-red-500">不可用</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {gateways.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    共 {gateways.length} 个网关 · {" "}
                    {gateways.filter((g) => g.available).length} 个可用
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">关于 IPFS</h3>
              <p className="text-sm text-blue-100 mb-4">
                此文件存储在 IPFS 网络上，通过分布式网关提供访问。选择延迟最低的网关可获得最佳下载体验。
              </p>
              <a
                href={`https://ipfs.io/ipfs/${cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-white hover:text-blue-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                在 ipfs.io 上查看
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-700 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <p>Powered by Crust Network & IPFS</p>
            <p className="mt-2 md:mt-0">
              CID: {cid.slice(0, 20)}...{cid.slice(-10)}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SharePage() {
  const params = useParams();
  const cid = params.cid as string;

  // 如果是静态生成的占位符页面，返回简单占位符
  if (cid === 'placeholder') {
    return <StaticPlaceholder />;
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <SharePageContent cid={cid} />
    </Suspense>
  );
}
