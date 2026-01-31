import { CONFIG } from "./config";
import type { FileRecord, Folder, ApiResponse, Gateway } from "@/types";
import { useAuthStore } from "./store";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = useAuthStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth.password) {
    headers["x-auth-token"] = auth.password;
  }

  if (auth.csrfToken) {
    headers["x-csrf-token"] = auth.csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    auth.logout();
    window.location.href = "/login";
    throw new ApiError("未授权，请重新登录", 401);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "请求失败" }));
    throw new ApiError(error.error || `HTTP ${response.status}`, response.status);
  }

  return response;
}

export const api = {
  async getToken(): Promise<string> {
    const response = await secureFetch(CONFIG.API_GET_TOKEN);
    const data = await response.json();
    return data.data?.token || data.token;
  },

  async loadFiles(): Promise<FileRecord[]> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=load_files`);
    const data: ApiResponse<FileRecord[]> = await response.json();
    if (!data.success) throw new Error(data.error || "加载文件失败");
    return data.data || [];
  },

  async saveFile(file: FileRecord): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=save_file`, {
      method: "POST",
      body: JSON.stringify(file),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "保存文件失败");
  },

  async addCid(cid: string, name: string, size: number, folderId: string = "default"): Promise<FileRecord> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=add_cid`, {
      method: "POST",
      body: JSON.stringify({ cid, name, size, folderId }),
    });
    const data: ApiResponse<FileRecord> = await response.json();
    if (!data.success) throw new Error(data.error || "添加CID失败");
    return data.data!;
  },

  async fetchCidInfo(cid: string): Promise<{ name: string; size: number } | null> {
    try {
      // 尝试从IPFS网关获取文件信息
      const gateways = [
        "https://ipfs.io",
        "https://gateway.ipfs.io",
        "https://cloudflare-ipfs.com",
      ];

      for (const gateway of gateways) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          // 尝试获取文件/目录信息
          const response = await fetch(`${gateway}/api/v0/ls?arg=${cid}`, {
            method: "POST",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.Objects && data.Objects.length > 0) {
              const obj = data.Objects[0];
              if (obj.Links && obj.Links.length > 0) {
                // 如果是目录，获取第一个文件的名称
                const firstLink = obj.Links[0];
                return {
                  name: firstLink.Name || `file-${cid.slice(0, 8)}`,
                  size: firstLink.Size || 0,
                };
              } else {
                // 如果是单个文件
                return {
                  name: `file-${cid.slice(0, 8)}`,
                  size: Number(obj.Size) || 0,
                };
              }
            }
          }
        } catch {
          continue;
        }
      }

      // 如果API方法失败，尝试通过HEAD请求获取大小
      for (const gateway of gateways) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(`${gateway}/ipfs/${cid}`, {
            method: "HEAD",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const contentLength = response.headers.get("content-length");
            return {
              name: `file-${cid.slice(0, 8)}`,
              size: contentLength ? (parseInt(contentLength) || 0) : 0,
            };
          }
        } catch {
          continue;
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  async deleteFile(fileId: string | number): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=delete_file`, {
      method: "POST",
      body: JSON.stringify({ fileId }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "删除文件失败");
  },

  async deleteFiles(fileIds: (string | number)[]): Promise<number> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=delete_files`, {
      method: "POST",
      body: JSON.stringify({ fileIds }),
    });
    const data: ApiResponse<{ deleted: number }> = await response.json();
    if (!data.success) throw new Error(data.error || "批量删除文件失败");
    return data.data?.deleted || 0;
  },

  async renameFile(fileId: string | number, newName: string): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=rename_file`, {
      method: "POST",
      body: JSON.stringify({ fileId, newName }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "重命名文件失败");
  },

  async moveFiles(fileIds: (string | number)[], folderId: string): Promise<number> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=move_files`, {
      method: "POST",
      body: JSON.stringify({ fileIds, folderId }),
    });
    const data: ApiResponse<{ moved: number }> = await response.json();
    if (!data.success) throw new Error(data.error || "移动文件失败");
    return data.data?.moved || 0;
  },

  async copyFiles(fileIds: (string | number)[], folderId: string): Promise<number> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=copy_files`, {
      method: "POST",
      body: JSON.stringify({ fileIds, folderId }),
    });
    const data: ApiResponse<{ copied: number }> = await response.json();
    if (!data.success) throw new Error(data.error || "复制文件失败");
    return data.data?.copied || 0;
  },

  async loadFolders(): Promise<Folder[]> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=load_folders`);
    const data: ApiResponse<Folder[]> = await response.json();
    if (!data.success) throw new Error(data.error || "加载文件夹失败");
    return data.data || [];
  },

  async createFolder(name: string, parentId: string | null = null): Promise<Folder> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=create_folder`, {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    });
    const data: ApiResponse<Folder> = await response.json();
    if (!data.success) throw new Error(data.error || "创建文件夹失败");
    return data.data!;
  },

  async renameFolder(folderId: string, newName: string): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=rename_folder`, {
      method: "POST",
      body: JSON.stringify({ folderId, newName }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "重命名文件夹失败");
  },

  async deleteFolder(folderId: string): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=delete_folder`, {
      method: "POST",
      body: JSON.stringify({ folderId }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "删除文件夹失败");
  },

  async getDbStats(): Promise<{
    files: { count: number };
    folders: { count: number };
  }> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=db_stats`);
    const data: ApiResponse<{
      keys: {
        files: { count: number };
        folders: { count: number };
      };
    }> = await response.json();
    if (!data.success) throw new Error(data.error || "获取统计失败");
    return {
      files: data.data!.keys.files,
      folders: data.data!.keys.folders,
    };
  },

  async checkVerificationStatus(): Promise<FileRecord[]> {
    const response = await secureFetch(`${CONFIG.API_DB_PROXY}?action=check_verification_status`);
    const data: ApiResponse<{ failedFiles: FileRecord[] }> = await response.json();
    if (!data.success) throw new Error(data.error || "检查验证状态失败");
    return data.data?.failedFiles || [];
  },
};

export const uploadApi = {
  async uploadToCrust(
    file: File,
    token: string,
    onProgress: (progress: number) => void
  ): Promise<{ cid: string; size: number; hash?: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              cid: response.Hash || response.cid,
              size: response.Size || file.size,
              hash: response.Hash,
            });
          } catch {
            reject(new Error("解析响应失败"));
          }
        } else {
          reject(new Error(`上传失败: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("上传过程中发生错误"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("上传已取消"));
      });

      xhr.open("POST", CONFIG.CRUST_UPLOAD_API);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  async verifyFile(cid: string): Promise<{
    verified: boolean;
    status: "ok" | "failed" | "pending";
    message?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.INTEGRITY_CHECK.HEAD_TIMEOUT);

      const response = await fetch(`https://ipfs.io/ipfs/${cid}`, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { verified: true, status: "ok" };
      } else {
        return { verified: false, status: "failed", message: "文件验证失败" };
      }
    } catch {
      return { verified: false, status: "pending", message: "验证超时" };
    }
  },
};

export const gatewayApi = {
  async fetchPublicGateways(): Promise<Gateway[]> {
    const gateways: Gateway[] = [];
    const seenUrls = new Set<string>();

    for (const source of CONFIG.PUBLIC_GATEWAY_SOURCES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(source, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const urls: string[] = await response.json();

          urls.forEach((url, index) => {
            let gatewayUrl = url;
            if (!gatewayUrl.endsWith("/")) {
              gatewayUrl += "/";
            }
            if (!gatewayUrl.includes("/ipfs/")) {
              gatewayUrl += "ipfs/";
            }

            if (!seenUrls.has(gatewayUrl)) {
              seenUrls.add(gatewayUrl);

              const hostname = new URL(url).hostname;
              const isCN = hostname.includes("cn") ||
                hostname.includes("china") ||
                hostname.includes("aliyun") ||
                hostname.includes("tencent") ||
                hostname.includes("baidu") ||
                hostname.includes("4everland") ||
                hostname.includes("ipfsscan") ||
                hostname.includes("cf-ipfs");

              gateways.push({
                name: hostname.replace(/^www\./, "").split(".")[0],
                url: gatewayUrl,
                icon: "🌐",
                priority: 20 + index,
                region: isCN ? "CN" : "INTL",
              });
            }
          });

          break;
        }
      } catch {
        continue;
      }
    }

    return gateways;
  },

  async testGateway(gateway: Gateway): Promise<{ available: boolean; latency: number }> {
    const testUrl = `${gateway.url}${CONFIG.TEST_CID}`;
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.GATEWAY_TEST.TIMEOUT);

      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);
      return { available: response.ok, latency };
    } catch {
      return { available: false, latency: Infinity };
    }
  },

  async testAllGateways(gateways: Gateway[]): Promise<Gateway[]> {
    const results: Gateway[] = [];
    const maxConcurrency = CONFIG.GATEWAY_TEST.CONCURRENT_LIMIT;
    const executing: Promise<void>[] = [];

    for (const gateway of gateways) {
      const testPromise = (async () => {
        const result = await this.testGateway(gateway);
        results.push({
          ...gateway,
          available: result.available,
          latency: result.latency,
          lastChecked: Date.now(),
        });
      })();

      executing.push(testPromise);

      // 当并发数达到上限时，等待最快的完成
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        // 清理已完成的 Promise
        const index = executing.findIndex(p => p === testPromise);
        if (index > -1) {
          executing.splice(index, 1);
        }
      }
    }

    // 等待所有剩余的测试完成
    await Promise.all(executing);

    return results.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return (a.latency || Infinity) - (b.latency || Infinity);
    });
  },

  getCachedResults(): Gateway[] | null {
    try {
      const cached = localStorage.getItem(CONFIG.GATEWAY_TEST.CHECK_CACHE_KEY);
      if (!cached) return null;

      const { version, timestamp, gateways } = JSON.parse(cached);
      if (version !== CONFIG.GATEWAY_TEST.CACHE_VERSION) return null;
      if (Date.now() - timestamp > CONFIG.GATEWAY_TEST.CHECK_CACHE_EXPIRY) return null;

      return gateways;
    } catch {
      return null;
    }
  },

  cacheResults(gateways: Gateway[]): void {
    localStorage.setItem(
      CONFIG.GATEWAY_TEST.CHECK_CACHE_KEY,
      JSON.stringify({
        version: CONFIG.GATEWAY_TEST.CACHE_VERSION,
        timestamp: Date.now(),
        gateways,
      })
    );
  },

  // 自动检测网关（带缓存机制）
  async autoTestGateways(customGateways: Gateway[] = []): Promise<Gateway[]> {
    // 先检查缓存
    const cached = this.getCachedResults();
    if (cached && cached.length > 0) {
      const availableCount = cached.filter(g => g.available).length;
      if (availableCount > 0) {
        return cached;
      }
    }

    // 如果没有缓存或没有可用网关，执行检测
    const allGateways = [...CONFIG.DEFAULT_GATEWAYS];

    // 从公共网关源获取更多网关
    try {
      const publicGateways = await this.fetchPublicGateways();
      publicGateways.forEach((publicGateway) => {
        if (!allGateways.find((g) => g.url === publicGateway.url)) {
          allGateways.push(publicGateway);
        }
      });
    } catch {
      console.warn("获取公共网关列表失败，使用默认网关");
    }

    // 添加自定义网关
    customGateways.forEach((custom) => {
      if (!allGateways.find((g) => g.url === custom.url)) {
        allGateways.push(custom);
      }
    });

    // 执行检测
    const results = await this.testAllGateways(allGateways);
    this.cacheResults(results);
    return results;
  },

  // 智能获取最优网关（自动检测）
  async getBestGatewayUrl(customGateways: Gateway[] = []): Promise<{ url: string; gateway: Gateway | null }> {
    const results = await this.autoTestGateways(customGateways);
    const availableGateways = results.filter((g) => g.available);

    if (availableGateways.length > 0) {
      const bestGateway = availableGateways.sort(
        (a, b) => (a.latency || Infinity) - (b.latency || Infinity)
      )[0];
      return { url: bestGateway.url, gateway: bestGateway };
    }

    // 如果没有可用网关，返回默认网关
    return { url: CONFIG.DEFAULT_GATEWAYS[0].url, gateway: null };
  },

  // 多网关并行下载 - 返回最快响应的网关URL
  async multiGatewayDownload(
    cid: string,
    gateways: Gateway[],
    onProgress?: (gateway: Gateway, status: 'testing' | 'success' | 'failed') => void
  ): Promise<{ url: string; gateway: Gateway } | null> {
    if (!gateways || gateways.length === 0) {
      return null;
    }

    // 只测试可用的网关
    const availableGateways = gateways.filter(g => g.available);
    if (availableGateways.length === 0) {
      return null;
    }

    // 按延迟排序，优先测试延迟低的
    const sortedGateways = availableGateways.sort(
      (a, b) => (a.latency || Infinity) - (b.latency || Infinity)
    );

    // 创建竞速下载 - 谁先响应成功就用谁
    return new Promise((resolve) => {
      let resolved = false;
      const testPromises: Promise<void>[] = [];

      // 限制并发数
      const batchSize = 3;
      const batches: Gateway[][] = [];
      for (let i = 0; i < sortedGateways.length; i += batchSize) {
        batches.push(sortedGateways.slice(i, i + batchSize));
      }

      // 逐批测试
      const testBatch = async (batch: Gateway[]) => {
        const batchPromises = batch.map(async (gateway) => {
          if (resolved) return;

          onProgress?.(gateway, 'testing');

          const testUrl = `${gateway.url}${cid}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          try {
            const response = await fetch(testUrl, {
              method: 'HEAD',
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok && !resolved) {
              resolved = true;
              onProgress?.(gateway, 'success');
              resolve({ url: testUrl, gateway });
            }
          } catch {
            onProgress?.(gateway, 'failed');
          }
        });

        await Promise.all(batchPromises);
      };

      // 执行所有批次
      (async () => {
        for (const batch of batches) {
          if (resolved) break;
          await testBatch(batch);
          // 批次间短暂延迟
          if (!resolved) {
            await new Promise(r => setTimeout(r, 100));
          }
        }

        // 如果所有批次都完成还没有结果，返回最优网关
        if (!resolved) {
          const best = sortedGateways[0];
          if (best) {
            resolve({ url: `${best.url}${cid}`, gateway: best });
          } else {
            resolve(null);
          }
        }
      })();

      // 总体超时
      setTimeout(() => {
        if (!resolved) {
          const best = sortedGateways[0];
          if (best) {
            resolve({ url: `${best.url}${cid}`, gateway: best });
          } else {
            resolve(null);
          }
        }
      }, 30000);
    });
  },

  // 测试网关是否支持媒体流（Range请求）
  async testGatewayMediaSupport(gateway: Gateway): Promise<{
    supportsRange: boolean;
    supportsCors: boolean;
    latency: number;
  }> {
    const testUrl = `${gateway.url}${CONFIG.TEST_CID}`;
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // 测试 Range 请求支持
      const rangeResponse = await fetch(testUrl, {
        method: "HEAD",
        headers: {
          Range: "bytes=0-1023",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);
      const supportsRange = rangeResponse.status === 206 || rangeResponse.headers.has("content-range");
      const supportsCors = rangeResponse.headers.has("access-control-allow-origin");

      return { supportsRange, supportsCors, latency };
    } catch {
      return { supportsRange: false, supportsCors: false, latency: Infinity };
    }
  },

  // 获取最适合媒体播放的网关
  async getBestMediaGateway(
    gateways: Gateway[],
    preferRangeSupport: boolean = true
  ): Promise<Gateway | null> {
    const availableGateways = gateways.filter((g) => g.available);
    if (availableGateways.length === 0) return null;

    // 如果需要Range支持，测试每个网关
    if (preferRangeSupport) {
      const mediaTests = await Promise.all(
        availableGateways.map(async (gateway) => {
          const result = await this.testGatewayMediaSupport(gateway);
          return {
            ...gateway,
            mediaSupport: result,
          };
        })
      );

      // 优先选择支持Range和CORS的网关
      const mediaFriendly = mediaTests
        .filter((g) => g.mediaSupport.supportsRange && g.mediaSupport.supportsCors)
        .sort((a, b) => a.mediaSupport.latency - b.mediaSupport.latency);

      if (mediaFriendly.length > 0) {
        return mediaFriendly[0];
      }
    }

    // 回退到普通延迟排序
    return availableGateways.sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity))[0];
  },
};

export const shareApi = {
  // 获取分享信息（公开访问）
  async getShareInfo(cid: string): Promise<{
    cid: string;
    filename?: string;
    size?: number;
    hasPassword: boolean;
    expiry?: string;
  } | null> {
    try {
      const response = await fetch(`${CONFIG.API_SHARE}?cid=${encodeURIComponent(cid)}`);
      const data: ApiResponse<{
        cid: string;
        filename?: string;
        size?: number;
        hasPassword: boolean;
        expiry?: string;
      }> = await response.json();

      if (!data.success) {
        return null;
      }
      return data.data || null;
    } catch {
      return null;
    }
  },

  // 创建分享（需要认证）
  async createShare(shareInfo: {
    cid: string;
    filename?: string;
    size?: number;
    password?: string;
    expiry?: string;
  }): Promise<void> {
    const response = await secureFetch(CONFIG.API_SHARE, {
      method: "POST",
      body: JSON.stringify(shareInfo),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "创建分享失败");
  },

  // 验证分享密码
  async verifyPassword(cid: string, password: string): Promise<{
    cid: string;
    filename?: string;
    size?: number;
    hasPassword: boolean;
    expiry?: string;
  } | null> {
    try {
      const response = await fetch(CONFIG.API_VERIFY_SHARE_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, password }),
      });
      const data: ApiResponse<{
        cid: string;
        filename?: string;
        size?: number;
        hasPassword: boolean;
        expiry?: string;
      }> = await response.json();

      if (!data.success) {
        return null;
      }
      return data.data || null;
    } catch {
      return null;
    }
  },

  // 删除分享（需要认证）
  async deleteShare(cid: string): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_SHARE}?cid=${encodeURIComponent(cid)}`, {
      method: "DELETE",
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "删除分享失败");
  },
};

export { ApiError };
