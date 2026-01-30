/**
 * 安全工具函数
 * 提供密码哈希、输入验证等安全相关功能
 */

/**
 * 使用 SHA-256 对密码进行哈希（异步版本）
 * @param password - 明文密码
 * @returns 哈希后的密码（十六进制字符串）
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // 使用 Web Crypto API 进行 SHA-256 哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 同步版本的密码哈希（用于服务端）
 * 注意：在 Cloudflare Workers 中需要使用异步版本
 * @param password - 明文密码
 * @returns 哈希后的密码
 */
export function hashPasswordSync(password: string): string {
  // 简单的同步哈希实现，用于兼容性
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * 验证密码
 * @param password - 用户输入的明文密码
 * @param hash - 存储的哈希值
 * @returns 是否匹配
 */
export function verifyPassword(password: string, hash: string): boolean {
  // 使用同步哈希进行比较
  const computedHash = hashPasswordSync(password);
  return computedHash === hash;
}

/**
 * 生成安全的随机令牌
 * @param length - 令牌长度（默认 32）
 * @returns 随机令牌
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 清理用户输入，防止 XSS 攻击
 * @param input - 用户输入
 * @returns 清理后的字符串
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * 验证文件名是否安全
 * @param filename - 文件名
 * @returns 是否安全
 */
export function isSafeFilename(filename: string): boolean {
  // 检查危险字符
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    return false;
  }
  
  // 检查路径遍历
  if (filename.includes('..') || filename.startsWith('/') || filename.startsWith('\\')) {
    return false;
  }
  
  // 检查长度
  if (filename.length === 0 || filename.length > 255) {
    return false;
  }
  
  return true;
}

/**
 * 安全的文件名处理
 * @param filename - 原始文件名
 * @returns 安全的文件名
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.\./g, '_')
    .trim();
}

/**
 * 允许的 MIME 类型列表
 */
export const ALLOWED_MIME_TYPES = [
  // 图片
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/bmp', 'image/tiff', 'image/avif',
  // 视频
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-msvideo', 'video/x-matroska',
  // 音频
  'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/mp4',
  'audio/ogg', 'audio/opus', 'audio/webm',
  // 文档
  'application/pdf', 'text/plain', 'text/markdown',
  'application/json', 'application/xml',
  // 压缩文件
  'application/zip', 'application/x-rar-compressed',
  'application/x-7z-compressed', 'application/gzip',
  // Office 文档
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

/**
 * 验证文件类型是否允许
 * @param mimeType - MIME 类型
 * @returns 是否允许
 */
export function isAllowedFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);
}

/**
 * 验证文件大小是否在限制内
 * @param size - 文件大小（字节）
 * @param maxSize - 最大大小（字节，默认 1GB）
 * @returns 是否合法
 */
export function isValidFileSize(size: number, maxSize: number = 1024 * 1024 * 1024): boolean {
  return size > 0 && size <= maxSize;
}

/**
 * 增强的 CID 验证
 * @param cid - CID 字符串
 * @returns 是否有效
 */
export function isValidCID(cid: string): boolean {
  if (!cid || typeof cid !== 'string') return false;
  
  const trimmedCid = cid.trim();
  
  // 长度检查
  if (trimmedCid.length < 1 || trimmedCid.length > 128) {
    return false;
  }
  
  // CID v0: Qm + 44 个 Base58 字符
  const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  
  // CID v1: bafy/bafk/bag + Base32 字符
  const cidV1Pattern = /^baf[a-z0-9]{52,58}$/;
  
  if (!cidV0Pattern.test(trimmedCid) && !cidV1Pattern.test(trimmedCid)) {
    return false;
  }
  
  // 防止路径遍历
  if (trimmedCid.includes('..') || trimmedCid.includes('/') || trimmedCid.includes('\\')) {
    return false;
  }
  
  return true;
}
