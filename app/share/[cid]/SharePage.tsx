"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Image, Film, Music } from "lucide-react";

import { useSharePage } from "@/hooks/use-share-page";
import { ShareHeader } from "@/components/share/share-header";
import { ShareFooter } from "@/components/share/share-footer";
import { PasswordGate } from "@/components/share/password-gate";
import { FileInfoCard } from "@/components/share/file-info-card";
import { DownloadSection } from "@/components/share/download-section";
import { GatewaySelector } from "@/components/share/gateway-selector";
import { IpfsInfoCard } from "@/components/share/ipfs-info-card";
import { ImageThumbnail, Lightbox } from "@/components/image-viewer";
import { MediaPlayer } from "@/components/media-player";

import { isImageFile, isMediaFile, isVideoFile } from "@/lib/utils";

// 加载状态
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

// 静态占位符
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const {
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
  } = useSharePage(cid);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated && shareInfo?.hasPassword) {
    return <PasswordGate cid={cid} onVerify={handleVerifyPassword} />;
  }

  const availableGateways = gateways.filter((g) => g.available);
  const isImage = isImageFile(shareInfo?.filename || "");
  const isMedia = isMediaFile(shareInfo?.filename || "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ShareHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧内容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* 文件信息卡片 */}
            <FileInfoCard
              cid={cid}
              filename={shareInfo?.filename}
              size={shareInfo?.size}
              expiry={shareInfo?.expiry}
              copiedCid={copiedCid}
              onCopyCid={handleCopyCid}
            />

            {/* 图片预览 */}
            {isImage && availableGateways.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                    <Image className="h-5 w-5 mr-2 text-green-500" />
                    图片预览
                  </h3>
                </div>
                <div className="p-4">
                  <ImageThumbnail
                    cid={cid}
                    filename={shareInfo?.filename || ""}
                    gateways={gateways}
                    onClick={() => setIsLightboxOpen(true)}
                    className="w-full h-64"
                  />
                </div>
              </motion.div>
            )}

            {/* 灯箱 */}
            <Lightbox
              isOpen={isLightboxOpen}
              onClose={() => setIsLightboxOpen(false)}
              cid={cid}
              filename={shareInfo?.filename || ""}
              gateways={gateways}
              onDownload={handleDownload}
            />

            {/* 媒体播放器 */}
            {isMedia && availableGateways.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                    {isVideoFile(shareInfo?.filename || "") ? (
                      <Film className="h-5 w-5 mr-2 text-purple-500" />
                    ) : (
                      <Music className="h-5 w-5 mr-2 text-pink-500" />
                    )}
                    在线播放
                  </h3>
                </div>
                <div className="p-4">
                  <MediaPlayer
                    cid={cid}
                    filename={shareInfo?.filename || ""}
                    gateways={gateways}
                    onGatewaySwitch={(gateway) => setSelectedGateway(gateway)}
                  />
                </div>
              </motion.div>
            )}

            {/* 下载区域 */}
            <DownloadSection
              selectedGateway={selectedGateway}
              isDownloading={isDownloading}
              isSmartSelecting={isSmartSelecting}
              downloadProgress={downloadProgress}
              gatewayTestStatus={gatewayTestStatus}
              gateways={gateways}
              onDownload={handleDownload}
              onSmartDownload={handleSmartDownload}
              onOpenInIpfs={handleOpenInIpfs}
              onRefreshGateways={testGateways}
            />
          </motion.div>

          {/* 右侧边栏 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* 网关选择器 */}
            <GatewaySelector
              gateways={gateways}
              selectedGateway={selectedGateway}
              isTesting={isTestingGateways}
              onSelect={setSelectedGateway}
              onRefresh={testGateways}
            />

            {/* IPFS 信息卡片 */}
            <IpfsInfoCard cid={cid} />
          </motion.div>
        </div>
      </main>

      <ShareFooter cid={cid} />
    </div>
  );
}

// 主组件
export default function SharePage() {
  const [isClient, setIsClient] = useState(false);
  const [cid, setCid] = useState<string>("");
  const params = useParams();

  useEffect(() => {
    setIsClient(true);

    // 从 URL 路径中提取 CID
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const cidFromPath = pathParts[pathParts.length - 1];

    if (cidFromPath && cidFromPath !== 'placeholder') {
      setCid(cidFromPath);
    } else if (params.cid && params.cid !== 'placeholder') {
      setCid(params.cid as string);
    }
  }, [params.cid]);

  // 在服务器端或 CID 未获取到时显示占位符
  if (!isClient || !cid || cid === "placeholder") {
    return <StaticPlaceholder />;
  }

  return <SharePageContent cid={cid} />;
}
