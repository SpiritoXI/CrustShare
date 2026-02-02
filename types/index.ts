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
export type VerifyStatus = 'pending' | 'verifying' | 'ok' | 'failed';

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
