"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Globe, Zap, Loader2, CheckCircle2, XCircle, RefreshCw, Clock, ArrowRight, History, Trash2, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/common";
import type { FileRecord, Gateway, DownloadTask, DownloadHistory } from "@/types";
import { formatFileSize } from "@/lib/utils";
import { gatewayApi } from "@/lib/api";
import { downloadApi } from "@/lib/api/download";
import type { DownloadTask as DownloadTaskType, Gateway as GatewayType } from "@/types";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileRecord | null;
  gateways: Gateway[];
  customGateways: Gateway[];
  onDownload: (cid: string, filename: string) => void;
  onDownloadWithGateway: (cid: string, filename: string, gateway: Gateway) => void;
  onTestGateways: () => void;
}

type DownloadPhase = 'select' | 'downloading' | 'completed' | 'failed';

export function DownloadModal({
  isOpen,
  onClose,
  file,
  gateways,
  customGateways,
  onDownload,
  onDownloadWithGateway,
  onTestGateways,
}: DownloadModalProps) {
  const [phase, setPhase] = useState<DownloadPhase>('select');
  const [isMultiTesting, setIsMultiTesting] = useState(false);
  const [gatewayStatuses, setGatewayStatuses] = useState<Map<string, 'pending' | 'testing' | 'success' | 'failed'>>(new Map());
  const [bestGateway, setBestGateway] = useState<Gateway | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [downloadTask, setDownloadTask] = useState<DownloadTask | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      setPhase('select');
      setDownloadTask(null);
      setGatewayStatuses(new Map());
      
      const history = downloadApi.loadDownloadHistory();
      setDownloadHistory(history.slice(0, 10));

      const availableGateways = gateways.filter(g => g.available);
      if (availableGateways.length > 0) {
        const sorted = [...availableGateways].sort(
          (a, b) => ((a.healthScore || 0) - (b.healthScore || 0)) || 
                     ((a.latency || Infinity) - (b.latency || Infinity))
        );
        setBestGateway(sorted[0]);
      }
    }
  }, [isOpen, file, gateways]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startMultiGatewayTest = useCallback(async () => {
    if (!file || gateways.length === 0) return;

    setIsMultiTesting(true);
    const availableGateways = gateways.filter(g => g.available);
    setGatewayStatuses(new Map(availableGateways.map(g => [g.name, 'pending'])));

    const result = await gatewayApi.multiGatewayDownload(
      file.cid,
      gateways,
      (gateway, status) => {
        setGatewayStatuses(prev => new Map(prev).set(gateway.name, status));
      }
    );

    if (result) {
      setBestGateway(result.gateway);
      startDownloadWithGateway(result.gateway);
    }

    setIsMultiTesting(false);
  }, [file, gateways]);

  const startDownloadWithGateway = useCallback(async (gateway: Gateway) => {
    if (!file) return;

    setPhase('downloading');
    
    abortControllerRef.current = new AbortController();

    try {
      const task = await downloadApi.downloadWithGateway(file.cid, gateway, {
        timeout: 60000,
        onProgress: (updatedTask: DownloadTaskType) => {
          setDownloadTask({ ...updatedTask, filename: file.name });
        },
        onStatusChange: (updatedTask: DownloadTaskType) => {
          setDownloadTask({ ...updatedTask, filename: file.name });
        },
      });

      if (task.status === 'completed') {
        task.filename = file.name;
        downloadApi.saveDownloadBlob(task);
        downloadApi.saveDownloadHistory(task);
        setPhase('completed');
        setDownloadTask(task);
      } else {
        setPhase('failed');
        setDownloadTask(task);
      }
    } catch (error) {
      setPhase('failed');
      setDownloadTask(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : '下载失败',
      } : null);
    }
  }, [file]);

  const startSmartDownload = useCallback(async () => {
    if (!file || gateways.length === 0) return;

    setPhase('downloading');
    setDownloadTask({
      id: downloadApi.generateTaskId(),
      cid: file.cid,
      filename: file.name,
      fileSize: file.size,
      status: 'downloading',
      progress: 0,
      downloadedBytes: 0,
      speed: 0,
      remainingTime: Infinity,
      startTime: Date.now(),
      gateway: bestGateway || gateways[0],
      gatewayIndex: 0,
      retryCount: 0,
      maxRetries: 3,
    });

    abortControllerRef.current = new AbortController();

    try {
      const task = await downloadApi.downloadWithAutoSwitch(
        file.cid,
        file.name,
        gateways,
        {
          maxRetries: 3,
          maxGatewaySwitches: 3,
          timeout: 60000,
          onProgress: (updatedTask: DownloadTaskType) => {
            setDownloadTask(updatedTask);
          },
          onStatusChange: (updatedTask: DownloadTaskType) => {
            setDownloadTask(updatedTask);
          },
          onGatewaySwitch: (oldGateway: GatewayType, newGateway: GatewayType) => {
            console.log(`切换网关: ${oldGateway.name} -> ${newGateway.name}`);
          },
        }
      );

      if (task.status === 'completed') {
        downloadApi.saveDownloadBlob(task);
        downloadApi.saveDownloadHistory(task);
        setPhase('completed');
      } else {
        setPhase('failed');
      }
      setDownloadTask(task);
    } catch (error) {
      setPhase('failed');
      setDownloadTask(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : '下载失败',
      } : null);
    }
  }, [file, gateways, bestGateway]);

  const handleCancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPhase('select');
    setDownloadTask(null);
  }, []);

  const handleRetry = useCallback(() => {
    if (bestGateway) {
      startDownloadWithGateway(bestGateway);
    } else {
      startSmartDownload();
    }
  }, [bestGateway, startDownloadWithGateway, startSmartDownload]);

  const handleClose = useCallback(() => {
    if (phase === 'downloading') {
      return;
    }
    onClose();
  }, [phase, onClose]);

  if (!file) return null;

  const title = (
    <h3 className="text-lg font-semibold flex items-center">
      <Download className="h-5 w-5 mr-2" />
      {phase === 'downloading' ? '正在下载' : phase === 'completed' ? '下载完成' : phase === 'failed' ? '下载失败' : '下载文件'}
    </h3>
  );

  const availableGateways = gateways.filter((g) => g.available);
  const hasGateways = gateways.length > 0;

  const renderPhaseContent = () => {
    switch (phase) {
      case 'select':
        return (
          <>
            {isMultiTesting && gatewayStatuses.size > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  正在测试所有网关响应速度...
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {Array.from(gatewayStatuses.entries()).map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">{name}</span>
                      <span>
                        {status === 'pending' && <span className="text-gray-400">等待中</span>}
                        {status === 'testing' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                        {status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        {status === 'failed' && <XCircle className="h-3 w-3 text-red-500" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bestGateway && !isMultiTesting && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      推荐网关: {bestGateway.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <span>{bestGateway.latency}ms</span>
                    {bestGateway.healthScore && (
                      <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-800 rounded">
                        健康 {bestGateway.healthScore}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">可用网关:</p>
                {hasGateways && (
                  <span className="text-xs text-muted-foreground">
                    {availableGateways.length}/{gateways.length} 可用
                  </span>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {!hasGateways ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">暂无网关数据</p>
                    <Button size="sm" onClick={onTestGateways}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      检测网关
                    </Button>
                  </div>
                ) : availableGateways.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">暂无可用网关</p>
                    <Button size="sm" onClick={onTestGateways}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      重新检测
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableGateways
                      .sort((a, b) => ((a.healthScore || 0) - (b.healthScore || 0)) || 
                                   ((a.latency || Infinity) - (b.latency || Infinity)))
                      .slice(0, 8)
                      .map((gateway, index) => (
                        <motion.div
                          key={gateway.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Button
                            variant="ghost"
                            className={`w-full justify-between rounded-none h-auto py-3 px-4 ${
                              bestGateway?.name === gateway.name ? 'bg-green-50 dark:bg-green-900/20' : ''
                            }`}
                            onClick={() => startDownloadWithGateway(gateway)}
                            disabled={isMultiTesting}
                          >
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{gateway.icon}</span>
                              <div className="text-left">
                                <p className="font-medium text-sm">{gateway.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{gateway.region === 'CN' ? '🇨🇳' : '🌍'}</span>
                                  {gateway.healthScore && (
                                    <span className={gateway.healthScore >= 70 ? 'text-green-600' : gateway.healthScore >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                                      健康 {gateway.healthScore}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 font-medium">{gateway.latency}ms</span>
                              <Download className="h-4 w-4" />
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={startSmartDownload}
                disabled={isMultiTesting || availableGateways.length === 0}
              >
                {isMultiTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    智能选择中...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1" />
                    智能下载（自动切换网关）
                  </>
                )}
              </Button>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onDownload(file.cid, file.name);
                    onClose();
                  }}
                  disabled={isMultiTesting}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  默认网关
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onTestGateways}
                  disabled={isMultiTesting}
                  title="重新检测网关"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {downloadHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <span className="flex items-center text-sm">
                    <History className="h-4 w-4 mr-2" />
                    下载历史
                  </span>
                  <span className="text-xs text-muted-foreground">{downloadHistory.length} 条记录</span>
                </Button>
                
                {showHistory && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {downloadHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2 truncate">
                          {item.success ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.filename}</span>
                        </div>
                        <span className="text-muted-foreground flex-shrink-0">
                          {formatFileSize(item.fileSize)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        );

      case 'downloading':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-medium">正在下载...</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {downloadTask?.progress || 0}%
                </span>
              </div>

              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadTask?.progress || 0}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">下载速度</p>
                  <p className="text-sm font-medium text-blue-600">
                    {downloadApi.formatSpeed(downloadTask?.speed || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">剩余时间</p>
                  <p className="text-sm font-medium text-blue-600">
                    {downloadApi.formatTime(downloadTask?.remainingTime || Infinity)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">已下载</p>
                  <p className="text-sm font-medium text-blue-600">
                    {formatFileSize(downloadTask?.downloadedBytes || 0)} / {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{downloadTask?.gateway?.icon}</span>
                <div>
                  <p className="text-sm font-medium">{downloadTask?.gateway?.name || '未知网关'}</p>
                  <p className="text-xs text-muted-foreground">
                    重试次数: {downloadTask?.retryCount || 0} / {downloadTask?.maxRetries || 3}
                  </p>
                </div>
              </div>
              {downloadTask?.gatewayIndex && downloadTask.gatewayIndex > 0 && (
                <span className="text-xs text-amber-600">
                  已切换 {downloadTask.gatewayIndex} 次网关
                </span>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancelDownload}
            >
              <X className="h-4 w-4 mr-1" />
              取消下载
            </Button>
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                下载完成
              </h4>
              <p className="text-sm text-green-600 dark:text-green-400">
                {file.name} 已成功下载
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">文件大小</p>
                <p className="font-medium">{formatFileSize(file.size)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">使用网关</p>
                <p className="font-medium">{downloadTask?.gateway?.name}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">平均速度</p>
                <p className="font-medium">{downloadApi.formatSpeed(downloadTask?.speed || 0)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">耗时</p>
                <p className="font-medium">
                  {downloadTask?.startTime && downloadTask?.endTime
                    ? downloadApi.formatTime((downloadTask.endTime - downloadTask.startTime) / 1000)
                    : '-'}
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={handleClose}>
              关闭
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                下载失败
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                {downloadTask?.error || '未知错误'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPhase('select')}
              >
                选择其他网关
              </Button>
              <Button
                className="flex-1"
                onClick={handleRetry}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                重试
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={handleClose}>
              关闭
            </Button>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderPhaseContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}
