/**
 * 网关类型定义
 */

export enum GatewayStatus {
  AVAILABLE = 'available',      // 可用
  UNAVAILABLE = 'unavailable',  // 不可用
  DEGRADED = 'degraded',        // 降级（响应慢）
  MAINTENANCE = 'maintenance',  // 维护中
}

export enum GatewayType {
  IPFS = 'ipfs',                // IPFS 网关
  CRUSTFILES = 'crustfiles',    // CrustFiles 网关
  CUSTOM = 'custom',            // 自定义网关
}

export interface GatewayConfig {
  id: string;                   // 网关唯一 ID
  name: string;                 // 网关名称
  type: GatewayType;            // 网关类型
  url: string;                  // 网关基础 URL
  priority: number;              // 优先级（数字越小优先级越高）
  enabled: boolean;             // 是否启用
  authRequired: boolean;        // 是否需要认证
  authToken?: string;           // 认证令牌（可选）
  headers?: Record<string, string>; // 自定义请求头
  timeout?: number;             // 超时时间（毫秒）
  maxRetries?: number;          // 最大重试次数
}

export interface GatewayState {
  id: string;
  status: GatewayStatus;
  lastCheckTime: Date;
  responseTime: number;         // 响应时间（毫秒）
  successRate: number;           // 成功率（0-1）
  totalChecks: number;          // 总检测次数
  successChecks: number;        // 成功次数
  failChecks: number;           // 失败次数
  lastError?: string;           // 最后一次错误信息
  consecutiveFails: number;     // 连续失败次数
  consecutiveSuccesses: number; // 连续成功次数
}

export interface GatewayHealthCheckResult {
  gatewayId: string;
  status: GatewayStatus;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

export interface GatewayDownloadMapping {
  fileId: string;               // 项目文件 ID
  cid: string;                  // IPFS CID
  gatewayId: string;           // 选定的网关 ID
  downloadUrl: string;         // 下载 URL
  accessToken?: string;        // 访问令牌（如果需要）
  createdAt: Date;             // 创建时间
  expiresAt?: Date;            // 过期时间（可选）
}

export interface GatewaySelectorOptions {
  excludeIds?: string[];       // 排除的网关 ID 列表
  requireAuth?: boolean;       // 是否需要认证
  maxResponseTime?: number;    // 最大响应时间（毫秒）
  minSuccessRate?: number;     // 最小成功率（0-1）
}
