/**
 * CrustFiles.io 直连客户端
 * 直接连接到 CrustFiles.io API，绕过 Vercel 的请求体大小限制
 */

export interface DirectUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type DirectProgressCallback = (progress: DirectUploadProgress) => void;

export interface DirectUploadOptions {
  onProgress?: DirectProgressCallback;
  headers?: Record<string, string>;
}

export interface DirectUploadResult {
  success: boolean;
  cid?: string;
  name?: string;
  size?: number;
  url?: string;
  error?: string;
}

class CrustFilesDirectClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(authToken?: string) {
    this.baseUrl = process.env.CRUSTFILES_BASE_URL || 'https://crustfiles.io';
    this.authToken = authToken;
  }

  /**
   * 设置认证 Token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * 获取认证 Token
   */
  getAuthToken(): string | undefined {
    return this.authToken;
  }

  /**
   * 清除认证 Token
   */
  clearAuthToken(): void {
    this.authToken = undefined;
  }

  /**
   * 构建完整的 API URL
   */
  private buildUrl(path: string): string {
    // 移除开头的斜杠，避免重复
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${cleanPath}`;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers();

    // 添加认证 Token
    if (this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }

    // 添加自定义 headers
    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers.append(key, value);
      });
    }

    return headers;
  }

  /**
   * 上传文件（直接连接 CrustFiles.io）
   * 使用 XMLHttpRequest 以支持上传进度
   */
  async upload(
    file: File,
    options?: DirectUploadOptions
  ): Promise<DirectUploadResult> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      const url = this.buildUrl('/api/v0/add');

      // 监听上传进度
      if (options?.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            options.onProgress!({
              loaded: event.loaded,
              total: event.total,
              percentage: (event.loaded / event.total) * 100,
            });
          }
        });
      }

      // 监听请求完成
      xhr.addEventListener('load', () => {
        const contentType = xhr.getResponseHeader('content-type') || '';
        let data: any;

        try {
          if (contentType.includes('application/json')) {
            data = JSON.parse(xhr.responseText);
          } else {
            data = xhr.responseText;
          }
        } catch (error) {
          data = xhr.responseText;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            cid: data.Hash || data.cid,
            name: data.Name || data.name || file.name,
            size: data.Size || data.size || file.size,
            url: `${this.baseUrl}/ipfs/${data.Hash || data.cid}`,
          });
        } else {
          resolve({
            success: false,
            error: `HTTP ${xhr.status}: ${xhr.statusText || '上传失败'}`,
          });
        }
      });

      // 监听请求错误
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: '网络错误，请检查网络连接',
        });
      });

      // 监听请求中止
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: '上传已取消',
        });
      });

      // 监听请求超时
      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: '上传超时，请重试',
        });
      });

      // 设置超时时间（30分钟）
      xhr.timeout = 30 * 60 * 1000;

      // 设置请求头
      const requestHeaders = this.buildHeaders(options?.headers);
      requestHeaders.forEach((value, key) => {
        xhr.setRequestHeader(key, value);
      });

      // 发送请求
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  /**
   * 下载文件（直接连接 CrustFiles.io）
   */
  async download(cid: string, fileName?: string): Promise<Blob> {
    const url = this.buildUrl(`/ipfs/${cid}`);
    const requestHeaders = this.buildHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      throw new Error(`下载失败: HTTP ${response.status}`);
    }

    return await response.blob();
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(cid: string): Promise<any> {
    const url = this.buildUrl(`/api/v0/object/stat?arg=${cid}`);
    const requestHeaders = this.buildHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      throw new Error(`获取文件信息失败: HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 执行 pin 操作（固定文件）
   */
  async pin(cid: string): Promise<{ success: boolean; error?: string }> {
    const url = this.buildUrl(`/api/v0/pin/add?arg=${cid}`);
    const requestHeaders = this.buildHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Pin 失败: HTTP ${response.status}`,
      };
    }

    return { success: true };
  }

  /**
   * 检查 pin 状态
   */
  async isPinned(cid: string): Promise<boolean> {
    const url = this.buildUrl(`/api/v0/pin/ls?arg=${cid}`);
    const requestHeaders = this.buildHeaders();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// 单例模式
let directClientInstance: CrustFilesDirectClient | null = null;

/**
 * 获取直连客户端实例
 */
export function getCrustFilesDirectClient(authToken?: string): CrustFilesDirectClient {
  if (!directClientInstance) {
    directClientInstance = new CrustFilesDirectClient(authToken);
  } else if (authToken) {
    directClientInstance.setAuthToken(authToken);
  }

  return directClientInstance;
}

/**
 * 清除客户端实例
 */
export function clearCrustFilesDirectClient(): void {
  directClientInstance = null;
}
