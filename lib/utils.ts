import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

export function hashPassword(password: string): string {
  const crypto = require("crypto-js");
  return crypto.SHA256(password).toString();
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
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
