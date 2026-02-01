/**
 * 后台自动修复服务
 * 自动检测并修复损坏的文件
 */

import { api, downloadApi, gatewayApi } from "./api";
import { verifyFileIntegrity } from "./security";
import { CONFIG } from "./config";
import type { FileRecord, Gateway } from "@/types";

/**
 * 修复任务状态
 */
export type RepairStatus =
  | "pending"     // 等待修复
  | "repairing"   // 修复中
  | "success"     // 修复成功
  | "failed"      // 修复失败
  | "skipped"     // 跳过修复
  | "unrepairable"; // 无法修复（所有网关都不可用）

/**
 * 修复任务
 */
export interface RepairTask {
  fileId: string | number;
  cid: string;
  filename: string;
  expectedHash: string;
  expectedSize: number;
  status: RepairStatus;
  attempts: number;
  maxAttempts: number;
  lastAttempt?: number;
  error?: string;
  repairedAt?: number;
}

/**
 * 修复结果
 */
export interface RepairResult {
  task: RepairTask;
  success: boolean;
  message: string;
  usedGateway?: Gateway;
  newCid?: string;
  unrepairable?: boolean; // 标记是否无法修复
  suggestions?: string[]; // 给用户的建议
}

/**
 * 自动修复配置
 */
export interface AutoRepairConfig {
  enabled: boolean;
  checkInterval: number;      // 检查间隔（毫秒）
  maxConcurrent: number;      // 最大并发修复数
  maxAttempts: number;        // 最大尝试次数
  retryDelay: number;         // 重试延迟（毫秒）
  autoDownload: boolean;      // 是否自动下载修复后的文件
  notifyOnSuccess: boolean;   // 修复成功时通知
  notifyOnFailure: boolean;   // 修复失败时通知
  notifyOnUnrepairable: boolean; // 无法修复时通知
  enableExternalRecovery: boolean; // 是否启用外部恢复（如重新上传）
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: AutoRepairConfig = {
  enabled: true,
  checkInterval: 5 * 60 * 1000,  // 5分钟
  maxConcurrent: 3,
  maxAttempts: 5,
  retryDelay: 30 * 1000,         // 30秒
  autoDownload: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  notifyOnUnrepairable: true,
  enableExternalRecovery: true,
};

/**
 * 存储键
 */
const STORAGE_KEYS = {
  REPAIR_QUEUE: "crustshare_repair_queue",
  REPAIR_CONFIG: "crustshare_repair_config",
  REPAIR_HISTORY: "crustshare_repair_history",
};

/**
 * 自动修复服务
 */
class AutoRepairService {
  private config: AutoRepairConfig;
  private repairQueue: RepairTask[] = [];
  private isRunning = false;
  private checkIntervalId?: number;
  private onStatusChange?: (task: RepairTask) => void;
  private onComplete?: (result: RepairResult) => void;

  constructor(config: Partial<AutoRepairConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadQueue();
    this.loadConfig();
  }

  /**
   * 设置状态变化回调
   */
  setOnStatusChange(callback: (task: RepairTask) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * 设置完成回调
   */
  setOnComplete(callback: (result: RepairResult) => void): void {
    this.onComplete = callback;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoRepairConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();

    // 如果启用了自动检查，重新启动
    if (this.config.enabled && this.checkIntervalId) {
      this.stop();
      this.start();
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): AutoRepairConfig {
    return { ...this.config };
  }

  /**
   * 添加修复任务
   */
  addTask(file: FileRecord): RepairTask {
    // 检查是否已存在
    const existingIndex = this.repairQueue.findIndex(
      (t) => t.fileId === file.id
    );

    if (existingIndex >= 0) {
      const existing = this.repairQueue[existingIndex];
      // 如果任务还在等待或失败，重置状态
      if (existing.status === "pending" || existing.status === "failed") {
        existing.status = "pending";
        existing.attempts = 0;
        existing.error = undefined;
        this.saveQueue();
        this.onStatusChange?.(existing);
      }
      return existing;
    }

    // 创建新任务
    const task: RepairTask = {
      fileId: file.id,
      cid: file.cid,
      filename: file.name,
      expectedHash: file.hash || "",
      expectedSize: file.size,
      status: "pending",
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
    };

    this.repairQueue.push(task);
    this.saveQueue();
    this.onStatusChange?.(task);

    // 如果服务正在运行，立即尝试处理
    if (this.isRunning) {
      this.processQueue();
    }

    return task;
  }

  /**
   * 移除修复任务
   */
  removeTask(fileId: string | number): boolean {
    const index = this.repairQueue.findIndex((t) => t.fileId === fileId);
    if (index >= 0) {
      this.repairQueue.splice(index, 1);
      this.saveQueue();
      return true;
    }
    return false;
  }

  /**
   * 获取修复队列
   */
  getQueue(): RepairTask[] {
    return [...this.repairQueue];
  }

  /**
   * 获取待修复任务数
   */
  getPendingCount(): number {
    return this.repairQueue.filter(
      (t) => t.status === "pending" || t.status === "failed"
    ).length;
  }

  /**
   * 启动自动修复服务
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) return;

    this.isRunning = true;
    console.log("[AutoRepair] 服务已启动");

    // 立即处理一次队列
    this.processQueue();

    // 设置定时检查
    this.checkIntervalId = window.setInterval(() => {
      this.processQueue();
    }, this.config.checkInterval);
  }

  /**
   * 停止自动修复服务
   */
  stop(): void {
    this.isRunning = false;
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = undefined;
    }
    console.log("[AutoRepair] 服务已停止");
  }

  /**
   * 检查服务是否运行中
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 手动触发修复
   */
  async repairFile(file: FileRecord): Promise<RepairResult> {
    const task = this.addTask(file);
    return this.executeRepair(task);
  }

  /**
   * 处理修复队列
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning) return;

    // 获取待修复的任务
    const pendingTasks = this.repairQueue.filter(
      (t) =>
        t.status === "pending" ||
        (t.status === "failed" &&
          t.attempts < t.maxAttempts &&
          (!t.lastAttempt ||
            Date.now() - t.lastAttempt > this.config.retryDelay))
    );

    if (pendingTasks.length === 0) return;

    // 限制并发数
    const tasksToProcess = pendingTasks.slice(0, this.config.maxConcurrent);

    // 并行处理
    await Promise.all(tasksToProcess.map((task) => this.executeRepair(task)));
  }

  /**
   * 执行修复任务
   */
  private async executeRepair(task: RepairTask): Promise<RepairResult> {
    // 更新任务状态
    task.status = "repairing";
    task.attempts++;
    task.lastAttempt = Date.now();
    this.saveQueue();
    this.onStatusChange?.(task);

    console.log(
      `[AutoRepair] 开始修复文件: ${task.filename} (尝试 ${task.attempts}/${task.maxAttempts})`
    );

    try {
      // 步骤 1: 验证文件是否真的损坏
      const isCorrupted = await this.verifyFileCorrupted(task);

      if (!isCorrupted) {
        task.status = "skipped";
        task.repairedAt = Date.now();
        this.saveQueue();
        this.onStatusChange?.(task);

        const result: RepairResult = {
          task,
          success: true,
          message: "文件未损坏，无需修复",
        };
        this.onComplete?.(result);
        return result;
      }

      // 步骤 2: 尝试从其他网关重新下载并验证
      const repairResult = await this.tryRepairFromGateways(task);

      if (repairResult.success) {
        task.status = "success";
        task.repairedAt = Date.now();
        this.saveQueue();
        this.onStatusChange?.(task);

        // 更新文件记录
        await this.updateFileRecord(task, repairResult);

        console.log(
          `[AutoRepair] 文件修复成功: ${task.filename} via ${repairResult.usedGateway?.name}`
        );
      } else if (repairResult.unrepairable) {
        // 无法修复的情况 - 标记为永久不可修复
        task.status = "unrepairable";
        task.error = repairResult.message;
        task.repairedAt = Date.now();
        this.saveQueue();
        this.onStatusChange?.(task);

        // 更新文件记录为不可修复状态
        await this.updateFileRecordUnrepairable(task, repairResult);

        console.error(
          `[AutoRepair] 文件无法修复: ${task.filename} - ${repairResult.message}`
        );
      } else {
        task.status = task.attempts >= task.maxAttempts ? "failed" : "pending";
        task.error = repairResult.message;
        this.saveQueue();
        this.onStatusChange?.(task);

        console.warn(
          `[AutoRepair] 文件修复失败: ${task.filename} - ${repairResult.message}`
        );
      }

      this.onComplete?.(repairResult);
      return repairResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "未知错误";
      task.status = task.attempts >= task.maxAttempts ? "failed" : "pending";
      task.error = errorMessage;
      this.saveQueue();
      this.onStatusChange?.(task);

      const result: RepairResult = {
        task,
        success: false,
        message: `修复过程出错: ${errorMessage}`,
      };
      this.onComplete?.(result);
      return result;
    }
  }

  /**
   * 验证文件是否损坏
   */
  private async verifyFileCorrupted(task: RepairTask): Promise<boolean> {
    try {
      // 从多个网关尝试获取文件并验证
      const testGateways = [
        "https://ipfs.io",
        "https://gateway.ipfs.io",
        "https://cloudflare-ipfs.com",
        "https://dweb.link",
      ];

      for (const gatewayUrl of testGateways) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            CONFIG.INTEGRITY_CHECK.HEAD_TIMEOUT
          );

          const response = await fetch(`${gatewayUrl}/ipfs/${task.cid}`, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            // 检查文件大小
            const contentLength = response.headers.get("content-length");
            if (contentLength) {
              const actualSize = parseInt(contentLength, 10);
              if (actualSize !== task.expectedSize) {
                console.warn(
                  `[AutoRepair] 文件大小不匹配: ${task.filename} (期望: ${task.expectedSize}, 实际: ${actualSize})`
                );
                return true; // 文件损坏
              }
            }

            // 如果有 hash，下载部分内容验证
            if (task.expectedHash) {
              const sampleResult = await this.downloadSampleAndVerify(
                task.cid,
                gatewayUrl,
                task.expectedHash
              );
              if (!sampleResult.valid) {
                return true; // 文件损坏
              }
            }

            return false; // 文件未损坏
          }
        } catch {
          // 继续尝试下一个网关
          continue;
        }
      }

      // 所有网关都无法访问，可能是网络问题
      console.warn(`[AutoRepair] 无法从任何网关访问文件: ${task.filename}`);
      return true; // 视为损坏，尝试修复
    } catch (error) {
      console.error(`[AutoRepair] 验证文件时出错:`, error);
      return true; // 出错时视为损坏
    }
  }

  /**
   * 下载样本并验证
   */
  private async downloadSampleAndVerify(
    cid: string,
    gatewayUrl: string,
    expectedHash: string
  ): Promise<{ valid: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CONFIG.INTEGRITY_CHECK.FULL_TIMEOUT
      );

      // 下载前 1MB 进行验证
      const response = await fetch(`${gatewayUrl}/ipfs/${cid}`, {
        method: "GET",
        headers: {
          Range: "bytes=0-1048575", // 1MB
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { valid: false };
      }

      const blob = await response.blob();
      const valid = await verifyFileIntegrity(expectedHash, blob);

      return { valid };
    } catch {
      return { valid: false };
    }
  }

  /**
   * 尝试从网关修复文件
   */
  private async tryRepairFromGateways(
    task: RepairTask
  ): Promise<RepairResult> {
    // 获取可用网关
    const allGateways = await gatewayApi.fetchPublicGateways();
    const defaultGateways = CONFIG.DEFAULT_GATEWAYS;

    // 合并网关列表
    const gateways: Gateway[] = [...defaultGateways];
    for (const g of allGateways) {
      if (!gateways.find((dg) => dg.url === g.url)) {
        gateways.push(g);
      }
    }

    // 测试网关可用性
    const testedGateways = await gatewayApi.testAllGateways(gateways);
    const availableGateways = testedGateways
      .filter((g) => g.available)
      .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));

    // 记录所有尝试过的网关及其失败原因
    const failedGateways: { name: string; reason: string }[] = [];

    if (availableGateways.length === 0) {
      return this.handleNoAvailableGateways(task, "没有可用的网关");
    }

    // 尝试从每个可用网关下载
    for (const gateway of availableGateways) {
      try {
        console.log(`[AutoRepair] 尝试从 ${gateway.name} 修复文件`);

        const downloadResult = await downloadApi.downloadFile(
          task.cid,
          task.filename,
          gateway,
          task.expectedHash
        );

        if (downloadResult.success && downloadResult.verified) {
          // 如果配置了自动下载，触发下载
          if (this.config.autoDownload && downloadResult.blob) {
            downloadApi.triggerDownload(downloadResult.blob, task.filename);
          }

          return {
            task,
            success: true,
            message: `成功从 ${gateway.name} 修复文件`,
            usedGateway: gateway,
          };
        }

        if (downloadResult.success && !downloadResult.verified) {
          const reason = "下载的文件验证失败（哈希不匹配）";
          failedGateways.push({ name: gateway.name, reason });
          console.warn(`[AutoRepair] 从 ${gateway.name} ${reason}`);
        } else {
          const reason = downloadResult.error || "下载失败";
          failedGateways.push({ name: gateway.name, reason });
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : "未知错误";
        failedGateways.push({ name: gateway.name, reason });
        console.warn(`[AutoRepair] 从 ${gateway.name} 修复失败:`, error);
      }
    }

    // 所有网关都失败了
    return this.handleAllGatewaysFailed(task, failedGateways);
  }

  /**
   * 处理没有可用网关的情况
   */
  private handleNoAvailableGateways(
    task: RepairTask,
    reason: string
  ): RepairResult {
    const suggestions = [
      "检查网络连接是否正常",
      "稍后再次尝试修复",
      "如果本地仍有原文件，可以删除后重新上传",
      "联系文件分享者重新分享",
    ];

    console.error(`[AutoRepair] 无法修复文件 ${task.filename}: ${reason}`);

    return {
      task,
      success: false,
      unrepairable: true,
      message: `无法修复: ${reason}`,
      suggestions,
    };
  }

  /**
   * 处理所有网关都失败的情况
   */
  private handleAllGatewaysFailed(
    task: RepairTask,
    failedGateways: { name: string; reason: string }[]
  ): RepairResult {
    const gatewayDetails = failedGateways
      .map((g) => `  - ${g.name}: ${g.reason}`)
      .join("\n");

    console.error(
      `[AutoRepair] 所有网关都无法修复文件 ${task.filename}:\n${gatewayDetails}`
    );

    // 分析失败原因
    const allHashMismatch = failedGateways.every((g) =>
      g.reason.includes("哈希不匹配")
    );
    const allNotFound = failedGateways.every(
      (g) => g.reason.includes("404") || g.reason.includes("Not Found")
    );

    let mainReason = "无法从任何网关获取有效的文件";
    const suggestions: string[] = [
      "检查网络连接是否正常",
      "稍后再次尝试修复",
    ];

    if (allHashMismatch) {
      mainReason = "所有网关上的文件都已损坏（哈希不匹配）";
      suggestions.push(
        "文件可能已在 IPFS 网络中被篡改或损坏",
        "如果本地仍有原文件，建议删除记录后重新上传",
        "联系文件分享者确认文件是否可用"
      );
    } else if (allNotFound) {
      mainReason = "文件已从所有网关下架（可能已被清理）";
      suggestions.push(
        "文件可能已从 IPFS 网络中删除",
        "如果本地仍有原文件，请重新上传",
        "联系文件分享者重新分享"
      );
    } else {
      suggestions.push(
        "如果本地仍有原文件，可以删除后重新上传",
        "联系文件分享者重新分享"
      );
    }

    return {
      task,
      success: false,
      unrepairable: true,
      message: mainReason,
      suggestions,
    };
  }

  /**
   * 更新文件记录
   */
  private async updateFileRecord(
    task: RepairTask,
    result: RepairResult
  ): Promise<void> {
    try {
      // 加载文件记录
      const files = await api.loadFiles();
      const file = files.find((f) => f.id === task.fileId);

      if (file) {
        // 更新验证状态
        file.verified = true;
        file.verify_status = "ok";
        file.verify_message = `自动修复成功 (通过 ${result.usedGateway?.name})`;

        // 保存更新
        await api.saveFile(file);
        console.log(`[AutoRepair] 已更新文件记录: ${file.name}`);
      }
    } catch (error) {
      console.error(`[AutoRepair] 更新文件记录失败:`, error);
    }
  }

  /**
   * 更新文件记录为无法修复状态
   */
  private async updateFileRecordUnrepairable(
    task: RepairTask,
    result: RepairResult
  ): Promise<void> {
    try {
      // 加载文件记录
      const files = await api.loadFiles();
      const file = files.find((f) => f.id === task.fileId);

      if (file) {
        // 更新验证状态为无法修复
        file.verified = false;
        file.verify_status = "unrepairable";
        file.verify_message = `无法自动修复: ${result.message}`;
        file.repair_suggestions = result.suggestions;

        // 保存更新
        await api.saveFile(file);
        console.log(`[AutoRepair] 已标记文件为无法修复: ${file.name}`);
      }
    } catch (error) {
      console.error(`[AutoRepair] 更新文件记录失败:`, error);
    }
  }

  /**
   * 保存队列到 localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.REPAIR_QUEUE,
        JSON.stringify(this.repairQueue)
      );
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 从 localStorage 加载队列
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REPAIR_QUEUE);
      if (stored) {
        this.repairQueue = JSON.parse(stored);
      }
    } catch {
      this.repairQueue = [];
    }
  }

  /**
   * 保存配置到 localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.REPAIR_CONFIG,
        JSON.stringify(this.config)
      );
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 从 localStorage 加载配置
   */
  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REPAIR_CONFIG);
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...DEFAULT_CONFIG, ...savedConfig };
      }
    } catch {
      // 使用默认配置
    }
  }

  /**
   * 清理历史记录
   */
  clearHistory(): void {
    this.repairQueue = this.repairQueue.filter(
      (t) => t.status === "pending" || t.status === "repairing"
    );
    this.saveQueue();
  }
}

/**
 * 全局自动修复服务实例
 */
let autoRepairService: AutoRepairService | null = null;

/**
 * 获取自动修复服务实例
 */
export function getAutoRepairService(
  config?: Partial<AutoRepairConfig>
): AutoRepairService {
  if (!autoRepairService) {
    autoRepairService = new AutoRepairService(config);
  }
  return autoRepairService;
}

/**
 * 初始化自动修复服务
 */
export function initAutoRepairService(
  config?: Partial<AutoRepairConfig>
): AutoRepairService {
  autoRepairService = new AutoRepairService(config);
  return autoRepairService;
}

/**
 * 扫描并修复所有损坏的文件
 */
export async function scanAndRepairFiles(
  files: FileRecord[],
  onProgress?: (current: number, total: number, file: FileRecord) => void
): Promise<{
  scanned: number;
  repaired: number;
  failed: number;
  skipped: number;
  unrepairable: number;
}> {
  const service = getAutoRepairService();
  const results = {
    scanned: 0,
    repaired: 0,
    failed: 0,
    skipped: 0,
    unrepairable: 0,
  };

  // 筛选出验证失败的文件（排除已标记为无法修复的）
  const corruptedFiles = files.filter(
    (f) =>
      f.verify_status === "failed" ||
      (f.verified === false && f.hash && f.verify_status !== "unrepairable")
  );

  for (let i = 0; i < corruptedFiles.length; i++) {
    const file = corruptedFiles[i];
    onProgress?.(i + 1, corruptedFiles.length, file);

    const result = await service.repairFile(file);
    results.scanned++;

    if (result.success) {
      if (result.message.includes("无需修复")) {
        results.skipped++;
      } else {
        results.repaired++;
      }
    } else if (result.unrepairable) {
      results.unrepairable++;
    } else {
      results.failed++;
    }
  }

  return results;
}

export default AutoRepairService;
