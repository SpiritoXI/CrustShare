/**
 * CrustFiles.io 代理客户端
 * 提供简单易用的 API 来通过后端代理访问 CrustFiles.io
 */

export interface ProxyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  headers?: Headers;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type ProgressCallback = (progress: UploadProgress) => void;

export interface ProxyUploadOptions {
  onProgress?: ProgressCallback;
  headers?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  cid?: string;
  name?: string;
  size?: number;
  url?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

class CrustFilesProxy {
  private baseUrl: string;
  private authToken?: string;

  constructor(authToken?: string) {
    this.baseUrl = '/api/proxy';
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
   * 构建完整的代理 URL
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
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<ProxyResponse<T>> {
    const contentType = response.headers.get('content-type') || '';

    let data: T | undefined;
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text() as T;
      } else {
        // 二进制数据
        data = await response.blob() as T;
      }
    } catch (error) {
      // 忽略解析错误
    }

    return {
      success: response.ok,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}`,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * GET 请求
   */
  async get<T = any>(path: string, headers?: Record<string, string>): Promise<ProxyResponse<T>> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders(headers);

    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST 请求（JSON）
   */
  async post<T = any>(
    path: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<ProxyResponse<T>> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders({
      'Content-Type': 'application/json',
      ...headers,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT 请求（JSON）
   */
  async put<T = any>(
    path: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<ProxyResponse<T>> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders({
      'Content-Type': 'application/json',
      ...headers,
    });

    const response = await fetch(url, {
      method: 'PUT',
      headers: requestHeaders,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(path: string, headers?: Record<string, string>): Promise<ProxyResponse<T>> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders(headers);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: requestHeaders,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH 请求（JSON）
   */
  async patch<T = any>(
    path: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<ProxyResponse<T>> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders({
      'Content-Type': 'application/json',
      ...headers,
    });

    const response = await fetch(url, {
      method: 'PATCH',
      headers: requestHeaders,
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * 上传文件（FormData）
   */
  async uploadFile(
    path: string,
    formData: FormData,
    options?: ProxyUploadOptions
  ): Promise<ProxyResponse> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders(options?.headers);

    // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
    requestHeaders.delete('Content-Type');

    // 创建 XMLHttpRequest 以支持上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

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

        const response: ProxyResponse = {
          success: xhr.status >= 200 && xhr.status < 300,
          data,
          error: xhr.status >= 200 && xhr.status < 300 ? undefined : `HTTP ${xhr.status}`,
          status: xhr.status,
        };

        resolve(response);
      });

      // 监听请求错误
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: '网络错误',
        });
      });

      // 监听请求中止
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: '请求已取消',
        });
      });

      // 设置请求头
      requestHeaders.forEach((value, key) => {
        xhr.setRequestHeader(key, value);
      });

      // 发送请求
      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  /**
   * 简化文件上传 API
   * 上传单个文件
   */
  async upload(
    file: File,
    options?: ProxyUploadOptions
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.uploadFile('/upload', formData, options);

    if (response.success) {
      return {
        success: true,
        cid: response.data?.cid,
        name: response.data?.name || file.name,
        size: response.data?.size || file.size,
        url: response.data?.url,
      };
    } else {
      return {
        success: false,
        error: response.error || '上传失败',
      };
    }
  }

  /**
   * 上传多个文件
   */
  async uploadMultiple(
    files: File[],
    options?: ProxyUploadOptions
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.upload(file, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 获取文件 URL
   */
  getFileUrl(cid: string): string {
    return this.buildUrl(`/ipfs/${cid}`);
  }

  /**
   * 下载文件
   */
  async downloadFile(cid: string, filename?: string): Promise<Blob | null> {
    const response = await this.get<Blob>(`/ipfs/${cid}`);

    if (response.success && response.data) {
      return response.data as Blob;
    }

    return null;
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(cid: string): Promise<ProxyResponse> {
    return this.get(`/api/v0/file/stat?arg=${cid}`);
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(cid: string): Promise<boolean> {
    const response = await this.getFileInfo(cid);
    return response.success;
  }
}

// 创建默认实例
let defaultProxy: CrustFilesProxy | null = null;

/**
 * 获取默认代理实例
 */
export function getProxy(authToken?: string): CrustFilesProxy {
  if (!defaultProxy) {
    defaultProxy = new CrustFilesProxy(authToken);
  } else if (authToken) {
    defaultProxy.setAuthToken(authToken);
  }
  return defaultProxy;
}

/**
 * 重置默认代理实例
 */
export function resetProxy(): void {
  defaultProxy = null;
}

// 导出类型
export type { CrustFilesProxy };
