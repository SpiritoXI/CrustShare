import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot === -1 ? "" : filename.slice(lastDot + 1).toLowerCase();
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    json: "application/json",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif"].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext);
}

export function isAudioFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["mp3", "wav", "flac", "aac", "ogg", "opus"].includes(ext);
}

export function isMediaFile(filename: string): boolean {
  return isImageFile(filename) || isVideoFile(filename) || isAudioFile(filename);
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === "pdf";
}

export function isTextFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["txt", "md", "json", "js", "ts", "jsx", "tsx", "css", "html", "xml"].includes(ext);
}

export function formatFileSize(size: number): string {
  return formatBytes(size);
}

export function getFileIcon(filename: string): string {
  const ext = getFileExtension(filename);
  
  if (isImageFile(filename)) return "📷";
  if (isVideoFile(filename)) return "🎥";
  if (isAudioFile(filename)) return "🎵";
  if (isPdfFile(filename)) return "📄";
  if (isTextFile(filename)) return "📝";
  if (ext === "json") return "🔧";
  if (ext === "zip" || ext === "rar" || ext === "7z" || ext === "tar" || ext === "gz") return "📦";
  
  return "📄";
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    });
}

export function extractCidFromInput(input: string): string {
  // Remove IPFS prefixes
  input = input.replace(/^ipfs:\/\//, '');
  input = input.replace(/^\/ipfs\//, '');
  
  // Remove trailing slashes
  input = input.trim().replace(/\/$/, '');
  
  // Extract CID (assuming it's the last part of the URL or the entire input)
  const parts = input.split('/');
  return parts[parts.length - 1];
}

export function validateCidFormat(cid: string): { valid: boolean; type: "v0" | "v1" | null; error?: string } {
  // Basic CID validation
  if (!cid || typeof cid !== 'string') {
    return { valid: false, type: null, error: 'CID不能为空' };
  }
  
  // Check length (CID v0 is 46 chars, v1 varies but should be at least 32 chars)
  if (cid.length < 32) {
    return { valid: false, type: null, error: 'CID格式不正确' };
  }
  
  // Check for valid CID v0 (starts with Qm)
  if (cid.startsWith('Qm') && cid.length === 46) {
    return { valid: true, type: "v0" };
  }
  
  // Check for valid CID v1 (starts with bafy)
  if (cid.startsWith('bafy') && cid.length >= 59) {
    return { valid: true, type: "v1" };
  }
  
  return { valid: false, type: null, error: 'CID格式不正确' };
}

export function inferFileType(filename: string): string {
  const ext = getFileExtension(filename);
  
  if (isImageFile(filename)) return "图片";
  if (isVideoFile(filename)) return "视频";
  if (isAudioFile(filename)) return "音频";
  if (isPdfFile(filename)) return "PDF文档";
  if (isTextFile(filename)) return "文本文件";
  if (ext === "json") return "JSON文件";
  if (ext === "zip" || ext === "rar" || ext === "7z" || ext === "tar" || ext === "gz") return "压缩文件";
  
  return "其他文件";
}

export function isCodeFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["js", "ts", "jsx", "tsx", "css", "html", "xml", "json", "md", "yaml", "yml", "toml"].includes(ext);
}

export function getFileLanguage(filename: string): string {
  const ext = getFileExtension(filename);
  
  const languageMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    css: "css",
    html: "html",
    xml: "xml",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
  };
  
  return languageMap[ext] || "text";
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
