/**
 * 自动修复 Hook
 * 在组件中使用后台自动修复服务
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAutoRepairService,
  initAutoRepairService,
  scanAndRepairFiles,
  type RepairTask,
  type RepairResult,
  type AutoRepairConfig,
} from "@/lib/auto-repair";
import { useFileStore, useUIStore } from "@/lib/store";
import type { FileRecord } from "@/types";

/**
 * 自动修复 Hook 返回类型
 */
export interface UseAutoRepairReturn {
  // 状态
  isRunning: boolean;
  queue: RepairTask[];
  pendingCount: number;
  isRepairing: boolean;
  lastResult?: RepairResult;

  // 控制方法
  start: () => void;
  stop: () => void;
  toggle: () => void;

  // 修复方法
  repairFile: (file: FileRecord) => Promise<RepairResult>;
  repairAll: () => Promise<void>;
  removeTask: (fileId: string | number) => boolean;
  clearHistory: () => void;

  // 配置
  config: AutoRepairConfig;
  updateConfig: (config: Partial<AutoRepairConfig>) => void;

  // 扫描结果
  scanResults?: {
    scanned: number;
    repaired: number;
    failed: number;
    skipped: number;
    unrepairable: number;
  };
}

/**
 * 自动修复 Hook
 */
export function useAutoRepair(): UseAutoRepairReturn {
  const { files } = useFileStore();
  const { showToast } = useUIStore();

  const serviceRef = useRef(getAutoRepairService());
  const [isRunning, setIsRunning] = useState(false);
  const [queue, setQueue] = useState<RepairTask[]>([]);
  const [isRepairing, setIsRepairing] = useState(false);
  const [lastResult, setLastResult] = useState<RepairResult | undefined>();
  const [config, setConfig] = useState<AutoRepairConfig>(
    serviceRef.current.getConfig()
  );
  const [scanResults, setScanResults] = useState<{
    scanned: number;
    repaired: number;
    failed: number;
    skipped: number;
    unrepairable: number;
  }>();

  // 初始化
  useEffect(() => {
    const service = serviceRef.current;

    // 设置回调
    service.setOnStatusChange((task) => {
      setQueue(service.getQueue());
      if (task.status === "repairing") {
        setIsRepairing(true);
      }
    });

    service.setOnComplete((result) => {
      setLastResult(result);
      setIsRepairing(false);
      setQueue(service.getQueue());

      // 显示通知
      if (result.success) {
        if (config.notifyOnSuccess && !result.message.includes("无需修复")) {
          showToast(`文件 "${result.task.filename}" 修复成功`, "success");
        }
      } else if (result.unrepairable) {
        // 无法修复的情况
        if (config.notifyOnUnrepairable) {
          const suggestions = result.suggestions?.join("；") || "";
          showToast(
            `文件 "${result.task.filename}" 无法自动修复。建议: ${suggestions}`,
            "error"
          );
        }
      } else {
        if (config.notifyOnFailure) {
          showToast(
            `文件 "${result.task.filename}" 修复失败: ${result.message}`,
            "error"
          );
        }
      }
    });

    // 同步初始状态
    setIsRunning(service.isServiceRunning());
    setQueue(service.getQueue());

    // 自动启动（如果配置了）
    if (service.getConfig().enabled && !service.isServiceRunning()) {
      service.start();
      setIsRunning(true);
    }

    return () => {
      // 组件卸载时不停止服务，让它在后台继续运行
    };
  }, [config.notifyOnSuccess, config.notifyOnFailure, showToast]);

  // 启动服务
  const start = useCallback(() => {
    serviceRef.current.start();
    setIsRunning(true);
    showToast("自动修复服务已启动", "success");
  }, [showToast]);

  // 停止服务
  const stop = useCallback(() => {
    serviceRef.current.stop();
    setIsRunning(false);
    showToast("自动修复服务已停止", "info");
  }, [showToast]);

  // 切换状态
  const toggle = useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  // 修复单个文件
  const repairFile = useCallback(
    async (file: FileRecord): Promise<RepairResult> => {
      setIsRepairing(true);
      try {
        const result = await serviceRef.current.repairFile(file);
        return result;
      } finally {
        setIsRepairing(false);
      }
    },
    []
  );

  // 修复所有损坏的文件
  const repairAll = useCallback(async () => {
    setIsRepairing(true);
    showToast("开始扫描并修复所有损坏的文件...", "info");

    try {
      const results = await scanAndRepairFiles(
        files,
        (current, total, file) => {
          console.log(
            `[AutoRepair] 进度: ${current}/${total} - ${file.name}`
          );
        }
      );

      setScanResults(results);

      if (results.repaired > 0) {
        const unrepairableMsg = results.unrepairable
          ? `, ${results.unrepairable} 个无法修复`
          : "";
        showToast(
          `修复完成: ${results.repaired} 个文件已修复, ${results.failed} 个失败${unrepairableMsg}`,
          results.failed > 0 || results.unrepairable > 0 ? "warning" : "success"
        );
      } else if (results.scanned === 0) {
        showToast("没有发现需要修复的文件", "info");
      } else if (results.unrepairable > 0) {
        showToast(
          `扫描完成: ${results.unrepairable} 个文件无法自动修复，建议手动处理`,
          "warning"
        );
      } else {
        showToast(`扫描完成: ${results.scanned} 个文件检查通过`, "success");
      }
    } catch (error) {
      showToast("修复过程出错", "error");
      console.error("[AutoRepair] 修复所有文件时出错:", error);
    } finally {
      setIsRepairing(false);
    }
  }, [files, showToast]);

  // 移除任务
  const removeTask = useCallback((fileId: string | number): boolean => {
    return serviceRef.current.removeTask(fileId);
  }, []);

  // 清理历史
  const clearHistory = useCallback(() => {
    serviceRef.current.clearHistory();
    setQueue(serviceRef.current.getQueue());
    showToast("已清理修复历史", "info");
  }, [showToast]);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<AutoRepairConfig>) => {
    serviceRef.current.updateConfig(newConfig);
    setConfig(serviceRef.current.getConfig());
  }, []);

  // 计算待修复数量
  const pendingCount = queue.filter(
    (t) => t.status === "pending" || t.status === "failed"
  ).length;

  return {
    isRunning,
    queue,
    pendingCount,
    isRepairing,
    lastResult,
    start,
    stop,
    toggle,
    repairFile,
    repairAll,
    removeTask,
    clearHistory,
    config,
    updateConfig,
    scanResults,
  };
}

export default useAutoRepair;
