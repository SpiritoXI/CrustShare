import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  // 处理非数字、NaN、负数等异常情况
  const numBytes = Number(bytes);
  if (!isFinite(numBytes) || numBytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  const index = Math.min(i, sizes.length - 1);
  return parseFloat((numBytes / Math.pow(k, index)).toFixed(2)) + " " + sizes[index];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
}

export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename);
  const iconMap: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📽️",
    pptx: "📽️",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    webp: "🖼️",
    svg: "🎨",
    mp4: "🎬",
    avi: "🎬",
    mov: "🎬",
    mkv: "🎬",
    webm: "🎬",
    ogv: "🎬",
    mp3: "🎵",
    wav: "🎵",
    flac: "🎵",
    ogg: "🎵",
    aac: "🎵",
    m4a: "🎵",
    zip: "📦",
    rar: "📦",
    "7z": "📦",
    tar: "📦",
    gz: "📦",
    js: "📜",
    ts: "📜",
    jsx: "📜",
    tsx: "📜",
    html: "🌐",
    css: "🎨",
    json: "📋",
    md: "📖",
    txt: "📃",
  };
  return iconMap[ext] || "📎";
}

// 视频文件扩展名列表
const VIDEO_EXTENSIONS = new Set([
  "mp4", "webm", "ogv", "ogg", "mov", "qt", "m4v", "mkv", "avi", "flv", "wmv", "mpg", "mpeg"
]);

// 音频文件扩展名列表
const AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "flac", "aac", "m4a", "ogg", "oga", "opus", "weba", "wma"
]);

// 媒体文件MIME类型映射
const MEDIA_MIME_TYPES: Record<string, string> = {
  // 视频
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  ogg: "video/ogg",
  mov: "video/quicktime",
  qt: "video/quicktime",
  m4v: "video/mp4",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  flv: "video/x-flv",
  wmv: "video/x-ms-wmv",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  // 音频
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
  oga: "audio/ogg",
  opus: "audio/opus",
  weba: "audio/webm",
  wma: "audio/x-ms-wma",
};

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return VIDEO_EXTENSIONS.has(ext);
}

export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return AUDIO_EXTENSIONS.has(ext);
}

export function isMediaFile(filename: string): boolean {
  return isVideoFile(filename) || isAudioFile(filename);
}

export function getMediaMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  return MEDIA_MIME_TYPES[ext] || (isVideoFile(filename) ? "video/mp4" : "audio/mpeg");
}

// 图片文件扩展名列表
const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "tif", "avif", "heic", "heif"
]);

// 图片文件MIME类型映射
const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  tif: "image/tiff",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return IMAGE_EXTENSIONS.has(ext);
}

export function getImageMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  return IMAGE_MIME_TYPES[ext] || "image/jpeg";
}

/**
 * 验证 CID 是否有效
 * @deprecated 请使用 security.ts 中的 isValidCID 函数
 * @param cid - CID 字符串
 * @returns 是否有效
 */
export function isValidCID(cid: string): boolean {
  if (!cid || typeof cid !== "string") return false;
  
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

export function sanitizeHtml(html: string): string {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 使用 SHA-256 对密码进行哈希（异步版本，使用 Web Crypto API）
 * @param password - 明文密码
 * @returns 哈希后的密码（十六进制字符串）
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 同步版本的密码哈希（用于兼容性）
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
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

export function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

/**
 * CID 格式验证结果
 */
export interface CidValidationResult {
  valid: boolean;
  type: 'v0' | 'v1' | null;
  error?: string;
}

/**
 * 验证 CID 格式
 * @param cid - CID 字符串
 * @returns 验证结果
 */
export function validateCidFormat(cid: string): CidValidationResult {
  if (!cid || typeof cid !== 'string') {
    return { valid: false, type: null, error: 'CID不能为空' };
  }

  const trimmedCid = cid.trim();

  if (trimmedCid.length === 0) {
    return { valid: false, type: null, error: 'CID不能为空' };
  }

  // CID v0: Qm开头，46字符长度 (Qm + 44 Base58)
  const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CID v1: bafy/bafk/bafz/baga等开头，Base32编码
  const cidV1Pattern = /^baf[a-z0-9]{52,}$/;
  // 其他可能的CID v1格式
  const cidV1AltPattern = /^k[2-7a-z]{58,}$/;

  if (cidV0Pattern.test(trimmedCid)) {
    return { valid: true, type: 'v0' };
  }

  if (cidV1Pattern.test(trimmedCid) || cidV1AltPattern.test(trimmedCid)) {
    return { valid: true, type: 'v1' };
  }

  return { valid: false, type: null, error: '无效的CID格式' };
}

/**
 * 从各种格式的输入中提取 CID
 * 支持的格式：
 * - 纯CID: Qm... 或 bafy...
 * - IPFS协议: ipfs://Qm... 或 ipfs://bafy...
 * - IPFS路径: /ipfs/Qm... 或 /ipfs/bafy...
 * - 完整URL: https://gateway.com/ipfs/Qm... 或 https://gateway.com/ipfs/bafy...
 * @param input - 用户输入的字符串
 * @returns 提取到的CID或null
 */
export function extractCidFromInput(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // CID v0 和 v1 的正则表达式
  const cidV0Pattern = /Qm[1-9A-HJ-NP-Za-km-z]{44}/;
  const cidV1Pattern = /baf[a-z0-9]{52,}/;
  const cidV1AltPattern = /k[2-7a-z]{58,}/;

  // 尝试匹配 CID v0
  const v0Match = trimmed.match(cidV0Pattern);
  if (v0Match) return v0Match[0];

  // 尝试匹配 CID v1
  const v1Match = trimmed.match(cidV1Pattern);
  if (v1Match) return v1Match[0];

  // 尝试匹配其他 CID v1 格式
  const v1AltMatch = trimmed.match(cidV1AltPattern);
  if (v1AltMatch) return v1AltMatch[0];

  return null;
}

/**
 * 从文件名推断文件类型
 * @param filename - 文件名
 * @returns 文件类型描述
 */
export function inferFileType(filename: string): string {
  const ext = getFileExtension(filename);
  const typeMap: Record<string, string> = {
    pdf: 'PDF文档',
    doc: 'Word文档',
    docx: 'Word文档',
    xls: 'Excel表格',
    xlsx: 'Excel表格',
    ppt: 'PPT演示',
    pptx: 'PPT演示',
    jpg: '图片',
    jpeg: '图片',
    png: '图片',
    gif: '图片',
    webp: '图片',
    svg: '矢量图',
    mp4: '视频',
    avi: '视频',
    mov: '视频',
    mkv: '视频',
    webm: '视频',
    mp3: '音频',
    wav: '音频',
    flac: '音频',
    ogg: '音频',
    aac: '音频',
    zip: '压缩包',
    rar: '压缩包',
    '7z': '压缩包',
    tar: '压缩包',
    gz: '压缩包',
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React组件',
    tsx: 'React组件',
    html: 'HTML页面',
    css: '样式表',
    json: 'JSON数据',
    md: 'Markdown文档',
    txt: '文本文件',
  };
  return typeMap[ext] || '文件';
}

/**
 * 格式化字节大小为人类可读格式（带单位）
 * @param bytes - 字节数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function buildTree(folders: Array<{ id: string; name: string; parentId: string | null }>): Array<{
  id: string;
  name: string;
  children: unknown[];
}> {
  const map = new Map();
  const roots: Array<{ id: string; name: string; children: unknown[] }> = [];

  folders.forEach((folder) => {
    map.set(folder.id, { ...folder, children: [] });
  });

  folders.forEach((folder) => {
    const node = map.get(folder.id);
    if (folder.parentId && map.has(folder.parentId)) {
      map.get(folder.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
