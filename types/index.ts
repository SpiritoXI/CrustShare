export interface FileRecord {
  id: string | number;
  name: string;
  size: number;
  cid: string;
  date: string;
  folder_id?: string;
  hash?: string;
  verified?: boolean;
  verify_status?: 'pending' | 'verifying' | 'ok' | 'failed';
  verify_message?: string;
  uploadedAt?: number;
  tags?: string[];
  version?: number;
  versions?: FileVersion[];
}

export interface FileVersion {
  version: number;
  cid: string;
  size: number;
  date: string;
  hash?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  children?: Folder[];
}

export interface Gateway {
  name: string;
  url: string;
  icon: string;
  priority: number;
  region: 'CN' | 'INTL';
  latency?: number;
  available?: boolean;
  healthScore?: number;
  lastChecked?: number;
  failureCount?: number;
  consecutiveFailures?: number;
  lastSuccess?: number;
}

export interface GatewayHealth {
  name: string;
  healthScore: number;
  failureCount: number;
  consecutiveFailures: number;
  lastSuccess: number;
  lastChecked: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  cid?: string;
  error?: string;
}

export interface ShareConfig {
  cid: string;
  expiresIn?: number;
  password?: string;
  allowedUsers?: string[];
  isPublic: boolean;
}

export interface User {
  id: string;
  passwordHash: string;
  lastLogin?: string;
  loginAttempts?: number;
  lockedUntil?: number;
}

export interface Session {
  token: string;
  expiresAt: number;
  userId: string;
}

export interface StorageStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ViewMode = 'list' | 'grid';

export type FileSortField = 'name' | 'size' | 'date' | 'type';
export type FileSortOrder = 'asc' | 'desc';

export interface FileFilter {
  folderId?: string;
  searchQuery?: string;
  tags?: string[];
  fileType?: string;
}
