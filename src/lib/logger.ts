/**
 * 日志记录系统
 * 记录上传、下载、网关检测等操作的日志
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum LogType {
  UPLOAD = 'upload',       // 上传相关
  DOWNLOAD = 'download',   // 下载相关
  GATEWAY = 'gateway',     // 网关相关
  PROXY = 'proxy',         // 代理相关
  SYSTEM = 'system',       // 系统相关
}

export interface LogEntry {
  id: string;
  level: LogLevel;
  type: LogType;
  message: string;
  data?: any;
  timestamp: Date;
  userId?: string;
  fileId?: string;
  gatewayId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // 最大日志数量

  /**
   * 记录日志
   */
  private log(
    level: LogLevel,
    type: LogType,
    message: string,
    data?: any,
    options?: {
      userId?: string;
      fileId?: string;
      gatewayId?: string;
    }
  ): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      type,
      message,
      data,
      timestamp: new Date(),
      userId: options?.userId,
      fileId: options?.fileId,
      gatewayId: options?.gatewayId,
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 输出到控制台
    this.logToConsole(entry);
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.type.toUpperCase()}] ${entry.timestamp.toISOString()}`;
    const suffix = entry.fileId ? ` [File: ${entry.fileId}]` : '';
    const gatewaySuffix = entry.gatewayId ? ` [Gateway: ${entry.gatewayId}]` : '';

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix}${suffix}${gatewaySuffix}`, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(`${prefix}${suffix}${gatewaySuffix}`, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix}${suffix}${gatewaySuffix}`, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix}${suffix}${gatewaySuffix}`, entry.message, entry.data);
        break;
    }
  }

  /**
   * Debug 日志
   */
  debug(type: LogType, message: string, data?: any, options?: Parameters<typeof this.log>[4]): void {
    this.log(LogLevel.DEBUG, type, message, data, options);
  }

  /**
   * Info 日志
   */
  info(type: LogType, message: string, data?: any, options?: Parameters<typeof this.log>[4]): void {
    this.log(LogLevel.INFO, type, message, data, options);
  }

  /**
   * Warn 日志
   */
  warn(type: LogType, message: string, data?: any, options?: Parameters<typeof this.log>[4]): void {
    this.log(LogLevel.WARN, type, message, data, options);
  }

  /**
   * Error 日志
   */
  error(type: LogType, message: string, data?: any, options?: Parameters<typeof this.log>[4]): void {
    this.log(LogLevel.ERROR, type, message, data, options);
  }

  /**
   * 上传日志
   */
  uploadStart(fileId: string, fileName: string, fileSize: number): void {
    this.info(LogType.UPLOAD, `上传开始: ${fileName}`, { fileSize }, { fileId });
  }

  uploadProgress(fileId: string, fileName: string, progress: number): void {
    this.debug(LogType.UPLOAD, `上传进度: ${fileName} - ${progress}%`, { progress }, { fileId });
  }

  uploadSuccess(fileId: string, fileName: string, cid: string, duration: number): void {
    this.info(LogType.UPLOAD, `上传成功: ${fileName}`, { cid, duration }, { fileId });
  }

  uploadError(fileId: string, fileName: string, error: string): void {
    this.error(LogType.UPLOAD, `上传失败: ${fileName}`, { error }, { fileId });
  }

  /**
   * 下载日志
   */
  downloadStart(fileId: string, fileName: string, gatewayId: string): void {
    this.info(LogType.DOWNLOAD, `下载开始: ${fileName} via ${gatewayId}`, {}, { fileId, gatewayId });
  }

  downloadSuccess(fileId: string, fileName: string, gatewayId: string, duration: number): void {
    this.info(LogType.DOWNLOAD, `下载成功: ${fileName} via ${gatewayId}`, { duration }, { fileId, gatewayId });
  }

  downloadError(fileId: string, fileName: string, gatewayId: string, error: string): void {
    this.error(LogType.DOWNLOAD, `下载失败: ${fileName} via ${gatewayId}`, { error }, { fileId, gatewayId });
  }

  downloadRetry(fileId: string, fileName: string, fromGatewayId: string, toGatewayId: string): void {
    this.warn(LogType.DOWNLOAD, `下载重试: ${fileName} ${fromGatewayId} -> ${toGatewayId}`, {}, { fileId, gatewayId: toGatewayId });
  }

  /**
   * 网关日志
   */
  gatewayCheckStart(gatewayId: string): void {
    this.debug(LogType.GATEWAY, `网关检测开始: ${gatewayId}`, {}, { gatewayId });
  }

  gatewayCheckSuccess(gatewayId: string, responseTime: number): void {
    this.debug(LogType.GATEWAY, `网关检测成功: ${gatewayId}`, { responseTime }, { gatewayId });
  }

  gatewayCheckFailed(gatewayId: string, error: string): void {
    this.warn(LogType.GATEWAY, `网关检测失败: ${gatewayId}`, { error }, { gatewayId });
  }

  gatewayStatusChange(gatewayId: string, fromStatus: string, toStatus: string): void {
    this.info(LogType.GATEWAY, `网关状态变更: ${gatewayId} ${fromStatus} -> ${toStatus}`, {}, { gatewayId });
  }

  gatewaySelected(gatewayId: string, fileId?: string): void {
    this.info(LogType.GATEWAY, `选择网关: ${gatewayId}`, {}, { fileId, gatewayId });
  }

  gatewayUnavailable(gatewayId: string, reason: string): void {
    this.error(LogType.GATEWAY, `网关不可用: ${gatewayId}`, { reason }, { gatewayId });
  }

  /**
   * 代理日志
   */
  proxyRequest(method: string, path: string): void {
    this.debug(LogType.PROXY, `代理请求: ${method} ${path}`);
  }

  proxySuccess(method: string, path: string, responseTime: number): void {
    this.debug(LogType.PROXY, `代理成功: ${method} ${path}`, { responseTime });
  }

  proxyError(method: string, path: string, error: string): void {
    this.error(LogType.PROXY, `代理错误: ${method} ${path}`, { error });
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 根据类型筛选日志
   */
  getLogsByType(type: LogType): LogEntry[] {
    return this.logs.filter(log => log.type === type);
  }

  /**
   * 根据级别筛选日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 根据文件 ID 筛选日志
   */
  getLogsByFileId(fileId: string): LogEntry[] {
    return this.logs.filter(log => log.fileId === fileId);
  }

  /**
   * 根据网关 ID 筛选日志
   */
  getLogsByGatewayId(gatewayId: string): LogEntry[] {
    return this.logs.filter(log => log.gatewayId === gatewayId);
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
    console.log('[Logger] 日志已清空');
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return {
      total: this.logs.length,
      byLevel: {
        debug: this.logs.filter(l => l.level === LogLevel.DEBUG).length,
        info: this.logs.filter(l => l.level === LogLevel.INFO).length,
        warn: this.logs.filter(l => l.level === LogLevel.WARN).length,
        error: this.logs.filter(l => l.level === LogLevel.ERROR).length,
      },
      byType: {
        upload: this.logs.filter(l => l.type === LogType.UPLOAD).length,
        download: this.logs.filter(l => l.type === LogType.DOWNLOAD).length,
        gateway: this.logs.filter(l => l.type === LogType.GATEWAY).length,
        proxy: this.logs.filter(l => l.type === LogType.PROXY).length,
        system: this.logs.filter(l => l.type === LogType.SYSTEM).length,
      },
    };
  }
}

// 创建默认实例
const logger = new Logger();

// 导出
export default logger;
