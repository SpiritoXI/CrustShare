/**
 * 类型定义文件
 * 包含项目中使用的所有 TypeScript 类型和接口
 */

// ============================================
// 文件相关类型
// ============================================

/**
 * 文件版本信息
 */
export interface FileVersion {
  version: number;
  cid: string;
  size: number;
  date: string;
  hash?: string;
}

/**
 * 文件验证状态
 */
export type VerifyStatus = 'pending' | 'verifying' | 'ok' | 'failed' | 'unrepairable';

/**
 * 文件记录
 */
export interface FileRecord {
  id: string | number;
  name: string;
  size: number;
  cid: string;
  date: string;
  folder_id?: string;
  hash?: string;
  verified?: boolean;
  verify_status?: VerifyStatus;
  verify_message?: string;
  repair_suggestions?: string[]; // 修复建议
  uploadedAt?: number;
  tags?: string[];
  version?: number;
  versions?: FileVersion[];
}

// ============================================
// 文件夹相关类型
// ============================================

/**
 * 文件夹
 */
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  children?: Folder[];
}

// ============================================
// 网关相关类型
// ============================================

/**
 * 网关区域
 */
export type GatewayRegion = 'CN' | 'INTL';

/**
 * IPFS 网关
 */
export interface Gateway {
  name: string;
  url: string;
  icon: string;
  priority: number;
  region: GatewayRegion;
  latency?: number;
  available?: boolean;
  reliability?: number;
  corsEnabled?: boolean;
  rangeSupport?: boolean;
  healthScore?: number;
  lastChecked?: number;
  failureCount?: number;
  consecutiveFailures?: number;
  lastSuccess?: number;
}

/**
 * 网关健康状态
 */
export interface GatewayHealth {
  name: string;
  healthScore: number;
  failureCount: number;
  consecutiveFailures: number;
  lastSuccess: number;
  lastChecked: number;
}

/**
 * 已保存的优质网关记录
 * 用于长期保存连通性较好的网关，优先检测
 */
export interface SavedGateway {
  name: string;
  url: string;
  icon: string;
  region: GatewayRegion;
  // 保存时的性能指标
  savedLatency: number;
  savedReliability: number;
  savedHealthScore: number;
  // 保存时间
  savedAt: number;
  // 成功次数统计（用于评估是否继续保持）
  successCount: number;
  // 检测次数统计
  checkCount: number;
  // 是否启用
  enabled: boolean;
}

/**
 * 网关保存配置
 */
export interface GatewaySaveConfig {
  // 保存网关的最小健康度分数
  minHealthScore: number;
  // 保存网关的最小可靠性百分比
  minReliability: number;
  // 最大保存网关数量
  maxSavedGateways: number;
  // 保存网关的最大延迟（毫秒）
  maxLatency: number;
  // 检测次数阈值（超过此次数且成功率达标才保存）
  minCheckCount: number;
  // 成功率阈值（百分比）
  minSuccessRate: number;
}

// ============================================
// 上传相关类型
// ============================================

/**
 * 上传状态
 */
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

/**
 * 上传进度
 */
export interface UploadProgress {
  file: File;
  progress: number;
  status: UploadStatus;
  cid?: string;
  error?: string;
}

// ============================================
// 分享相关类型
// ============================================

/**
 * 分享配置
 */
export interface ShareConfig {
  cid: string;
  expiresIn?: number;
  password?: string;
  allowedUsers?: string[];
  isPublic: boolean;
}

/**
 * 分享信息
 */
export interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
  password?: string;
  expiry?: string;
  hasPassword: boolean;
}

// ============================================
// 用户相关类型
// ============================================

/**
 * 用户
 */
export interface User {
  id: string;
  passwordHash: string;
  lastLogin?: string;
  loginAttempts?: number;
  lockedUntil?: number;
}

/**
 * 会话
 */
export interface Session {
  token: string;
  expiresAt: number;
  userId: string;
}

// ============================================
// 统计相关类型
// ============================================

/**
 * 存储统计
 */
export interface StorageStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
}

// ============================================
// API 相关类型
// ============================================

/**
 * API 响应
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// UI 相关类型
// ============================================

/**
 * 视图模式
 */
export type ViewMode = 'list' | 'grid';

/**
 * 文件排序字段
 */
export type FileSortField = 'name' | 'size' | 'date' | 'type';

/**
 * 文件排序顺序
 */
export type FileSortOrder = 'asc' | 'desc';

/**
 * 文件筛选条件
 */
export interface FileFilter {
  folderId?: string;
  searchQuery?: string;
  tags?: string[];
  fileType?: string;
}

// ============================================
// 环境变量类型
// ============================================

export type { Env, Context } from './env.d';
