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

  validateCid(cid: string): { valid: boolean; error?: string } {
    // CID v0: Qm开头，46字符长度
    const cidV0Pattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    // CID v1: b开头，使用base32编码
    const cidV1Pattern = /^b[2-7a-z]{58,}$/;
    // CID v1 base36: k开头
    const cidV1Base36Pattern = /^k[2-7a-z]{58,}$/;

    if (!cid || cid.trim() === "") {
      return { valid: false, error: "CID不能为空" };
    }

    const trimmedCid = cid.trim();

    if (cidV0Pattern.test(trimmedCid)) {
      return { valid: true };
    }

    if (cidV1Pattern.test(trimmedCid) || cidV1Base36Pattern.test(trimmedCid)) {
      return { valid: true };
    }

    return { valid: false, error: "无效的CID格式" };
  },

  async fetchCidInfo(cid: string): Promise<{ name: string; size: number; isDirectory: boolean; valid: boolean; error?: string } | null> {
    try {
      // 首先验证CID格式
      const validation = this.validateCid(cid);
      if (!validation.valid) {
        return {
          name: "",
          size: 0,
          isDirectory: false,
          valid: false,
          error: validation.error,
        };
      }

      // 尝试从IPFS网关获取文件信息
      const gateways = [
        "https://ipfs.io",
        "https://gateway.ipfs.io",
        "https://cloudflare-ipfs.com",
        "https://dweb.link",
        "https://gateway.pinata.cloud",
      ];

      // 首先尝试使用 /api/v0/ls 获取目录信息
      for (const gateway of gateways) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(`https://ipfs.io/api/v0/ls?arg=${cid}`, {
            method: "POST",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.Objects && data.Objects.length > 0) {
              const obj = data.Objects[0];
              if (obj.Links && obj.Links.length > 0) {
                let totalSize = 0;
                obj.Links.forEach((link: { Size?: number }) => {
                  totalSize += link.Size || 0;
                });
                return {
                  name: `folder-${cid.slice(0, 8)}`,
                  size: totalSize,
                  isDirectory: true,
                  valid: true,
                };
              }
            }
          }
        } catch {
          // 继续尝试下一个网关
        }
      }

      // 尝试通过 HEAD 请求获取单个文件信息
      for (const gateway of gateways) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(`${gateway}/ipfs/${cid}`, {
            method: "HEAD",
            signal: controller.signal,
            redirect: "follow",
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const contentLength = response.headers.get("content-length");
            const contentType = response.headers.get("content-type");
            const contentDisposition = response.headers.get("content-disposition");

            let filename: string | null = null;
            if (contentDisposition) {
              const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
              if (match) {
                filename = match[1].replace(/['"]/g, "");
              }
            }

            if (!filename) {
              const url = response.url;
              const urlParts = url.split("/");
              const lastPart = urlParts[urlParts.length - 1];
              if (lastPart && lastPart !== cid && !lastPart.startsWith("Qm") && !lastPart.startsWith("b")) {
                filename = decodeURIComponent(lastPart);
              }
            }

            let extension = "";
            if (contentType) {
              const extMap: Record<string, string> = {
                "image/jpeg": ".jpg",
                "image/jpg": ".jpg",
                "image/png": ".png",
                "image/gif": ".gif",
                "image/webp": ".webp",
                "image/svg+xml": ".svg",
                "application/pdf": ".pdf",
                "text/plain": ".txt",
                "text/markdown": ".md",
                "text/html": ".html",
                "application/json": ".json",
                "video/mp4": ".mp4",
                "video/webm": ".webm",
                "audio/mpeg": ".mp3",
                "audio/wav": ".wav",
                "application/zip": ".zip",
                "application/x-rar-compressed": ".rar",
                "application/x-7z-compressed": ".7z",
                "application/gzip": ".gz",
                "application/x-tar": ".tar",
              };
              extension = extMap[contentType.split(";")[0].trim()] || "";
            }

            const size = contentLength ? (parseInt(contentLength) || 0) : 0;

            return {
              name: filename || `file-${cid.slice(0, 8)}${extension}`,
              size: size,
              isDirectory: false,
              valid: true,
            };
          }
        } catch {
          // 继续尝试下一个网关
        }
      }

      // 如果所有网关都失败了，返回验证成功但无法获取信息
      return {
        name: `file-${cid.slice(0, 8)}`,
        size: 0,
        isDirectory: false,
        valid: true,
        error: "无法从IPFS网络获取文件信息，请手动填写文件名和大小",
      };
    } catch {
      return {
        name: `file-${cid.slice(0, 8)}`,
        size: 0,
        isDirectory: false,
        valid: true,
        error: "获取文件信息时发生错误，请手动填写文件名和大小",
      };
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

  async loadShares(): Promise<Array<{
    cid: string;
    filename?: string;
    size?: number;
    expiry?: string;
    createdAt: number;
    hasPassword: boolean;
  }>> {
    const response = await secureFetch(`${CONFIG.API_SHARE}?list=true`);
    const data: ApiResponse<Array<{
      cid: string;
      filename?: string;
      size?: number;
      expiry?: string;
      createdAt: number;
      hasPassword: boolean;
    }>> = await response.json();
    if (!data.success) throw new Error(data.error || "加载分享列表失败");
    return data.data || [];
  },

  async deleteShare(cid: string): Promise<void> {
    const response = await secureFetch(`${CONFIG.API_SHARE}?cid=${cid}`, {
      method: "DELETE",
    });
    const data: ApiResponse = await response.json();
    if (!data.success) throw new Error(data.error || "删除分享失败");
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

  async testGateway(
    gateway: Gateway,
    options: {
      retries?: number;
      samples?: number;
      testCid?: string;
    } = {}
  ): Promise<{
    available: boolean;
    latency: number;
    reliability: number;
    corsEnabled: boolean;
    rangeSupport: boolean;
  }> {
    const { retries = 2, samples = 3, testCid = CONFIG.TEST_CID } = options;
    const testUrl = `${gateway.url}${testCid}`;

    const latencies: number[] = [];
    let successCount = 0;
    let corsEnabled = false;
    let rangeSupport = false;

    // 多次采样测试
    for (let sample = 0; sample < samples; sample++) {
      let sampleLatency = Infinity;
      let sampleSuccess = false;

      // 每次采样支持重试
      for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, CONFIG.GATEWAY_TEST.RETRY_DELAY));
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            CONFIG.GATEWAY_TEST.TIMEOUT
          );

          const startTime = performance.now();

          // 使用 HEAD 请求进行基础测试
          const response = await fetch(testUrl, {
            method: "HEAD",
            signal: controller.signal,
            headers: {
              Accept: "*/*",
            },
          });

          const latency = Math.round(performance.now() - startTime);
          clearTimeout(timeoutId);

          // 检查响应状态码
          if (response.ok || response.status === 200 || response.status === 204) {
            sampleLatency = latency;
            sampleSuccess = true;

            // 检查 CORS 支持
            if (response.headers.has("access-control-allow-origin")) {
              corsEnabled = true;
            }

            // 检查 Range 支持
            if (response.headers.has("accept-ranges") || response.status === 206) {
              rangeSupport = true;
            }

            break; // 成功则跳出重试
          }
        } catch {
          // 继续重试
        }
      }

      if (sampleSuccess) {
        latencies.push(sampleLatency);
        successCount++;
      }
    }

    // 计算可靠性分数 (0-100)
    const reliability = Math.round((successCount / samples) * 100);

    // 计算平均延迟（去掉最高值，减少异常影响）
    let avgLatency = Infinity;
    if (latencies.length > 0) {
      const sorted = [...latencies].sort((a, b) => a - b);
      // 如果有多个样本，去掉最高值
      const validLatencies = sorted.length > 2 ? sorted.slice(0, -1) : sorted;
      avgLatency = Math.round(
        validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
      );
    }

    // 可用性判断：至少有一次成功且可靠性 >= 50%
    const available = successCount > 0 && reliability >= 50;

    return {
      available,
      latency: avgLatency,
      reliability,
      corsEnabled,
      rangeSupport,
    };
  },

  async testAllGateways(
    gateways: Gateway[],
    options: {
      onProgress?: (gateway: Gateway, result: Gateway) => void;
      priorityRegions?: string[];
    } = {}
  ): Promise<Gateway[]> {
    const { onProgress, priorityRegions = ["CN", "INTL"] } = options;
    const results: Gateway[] = [];
    const maxConcurrency = CONFIG.GATEWAY_TEST.CONCURRENT_LIMIT;

    // 按区域优先级排序网关
    const sortedGateways = [...gateways].sort((a, b) => {
      const aPriority = priorityRegions.indexOf(a.region);
      const bPriority = priorityRegions.indexOf(b.region);
      if (aPriority !== bPriority) {
        return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
      }
      return (a.priority || 999) - (b.priority || 999);
    });

    // 使用队列方式控制并发
    const queue = [...sortedGateways];
    const executing: Set<Promise<void>> = new Set();

    const processGateway = async (gateway: Gateway): Promise<void> => {
      // 根据网关历史表现调整测试参数
      const testOptions: Parameters<typeof this.testGateway>[1] = {
        retries: gateway.consecutiveFailures && gateway.consecutiveFailures > 2 ? 1 : 2,
        samples: gateway.healthScore && gateway.healthScore < 50 ? 2 : 3,
      };

      const result = await this.testGateway(gateway, testOptions);

      // 计算健康度评分
      const healthScore = this.calculateHealthScore(gateway, result);

      const gatewayResult: Gateway = {
        ...gateway,
        available: result.available,
        latency: result.latency,
        reliability: result.reliability,
        corsEnabled: result.corsEnabled,
        rangeSupport: result.rangeSupport,
        lastChecked: Date.now(),
        healthScore,
        failureCount: result.available
          ? Math.max(0, (gateway.failureCount || 0) - 1)
          : (gateway.failureCount || 0) + 1,
        consecutiveFailures: result.available ? 0 : (gateway.consecutiveFailures || 0) + 1,
        lastSuccess: result.available ? Date.now() : gateway.lastSuccess,
      };

      results.push(gatewayResult);
      onProgress?.(gateway, gatewayResult);
    };

    // 持续处理直到队列为空且所有任务完成
    while (queue.length > 0 || executing.size > 0) {
      // 启动新任务直到达到并发上限或队列为空
      while (executing.size < maxConcurrency && queue.length > 0) {
        const gateway = queue.shift()!;
        const promise = processGateway(gateway).finally(() => {
          executing.delete(promise);
        });
        executing.add(promise);
      }

      // 等待任意一个任务完成
      if (executing.size > 0) {
        await Promise.race(executing);
      }
    }

    // 排序：可用性 > 健康度 > 延迟 > 区域优先级
    return results.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if ((b.healthScore || 0) !== (a.healthScore || 0)) {
        return (b.healthScore || 0) - (a.healthScore || 0);
      }
      return (a.latency || Infinity) - (b.latency || Infinity);
    });
  },

  // 计算网关健康度评分
  calculateHealthScore(
    gateway: Gateway,
    testResult: { available: boolean; latency: number; reliability: number }
  ): number {
    const { BASE_LATENCY_SCORE, MAX_LATENCY, SUCCESS_BONUS, FAILURE_PENALTY, CN_REGION_BONUS } =
      CONFIG.GATEWAY_HEALTH.SCORING;

    let score = gateway.healthScore || BASE_LATENCY_SCORE;

    if (testResult.available) {
      // 基于延迟计算基础分
      const latencyRatio = Math.min(testResult.latency / MAX_LATENCY, 1);
      const latencyScore = Math.round((1 - latencyRatio) * BASE_LATENCY_SCORE);

      // 可靠性加分
      const reliabilityBonus = Math.round((testResult.reliability / 100) * SUCCESS_BONUS);

      // 区域加分
      const regionBonus = gateway.region === "CN" ? CN_REGION_BONUS : 0;

      // 综合评分（加权平均）
      score = Math.round(latencyScore * 0.5 + reliabilityBonus * 0.3 + regionBonus * 0.2);

      // 连续成功奖励
      if (gateway.consecutiveFailures === 0 && gateway.lastSuccess) {
        score = Math.min(score + 2, 100);
      }
    } else {
      // 失败扣分
      score = Math.max(score - FAILURE_PENALTY * ((gateway.consecutiveFailures || 0) + 1), 0);
    }

    return Math.round(score);
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
  async autoTestGateways(
    customGateways: Gateway[] = [],
    forceRefresh: boolean = false,
    options: {
      onProgress?: (gateway: Gateway, result: Gateway) => void;
      priorityRegions?: string[];
    } = {}
  ): Promise<Gateway[]> {
    const { onProgress, priorityRegions } = options;

    // 加载历史健康度数据
    const healthHistory = this.loadHealthHistory();

    // 先检查缓存（除非强制刷新）
    if (!forceRefresh) {
      const cached = this.getCachedResults();
      if (cached && cached.length > 0) {
        // 验证缓存中的网关是否包含当前所有默认网关
        const cachedUrls = new Set(cached.map((g) => g.url));
        const defaultUrls = CONFIG.DEFAULT_GATEWAYS.map((g) => g.url);
        const hasAllDefaults = defaultUrls.every((url) => cachedUrls.has(url));

        // 检查缓存是否过期（超过5分钟）
        const cacheAge = Date.now() - (cached[0]?.lastChecked || 0);
        const cacheExpired = cacheAge > 5 * 60 * 1000;

        // 只有当缓存包含所有默认网关、有可用网关且未过期时才使用缓存
        const availableCount = cached.filter((g) => g.available).length;
        if (availableCount > 0 && hasAllDefaults && !cacheExpired) {
          // 合并历史健康度数据
          const merged = cached.map((g) => ({
            ...g,
            ...healthHistory[g.name],
          }));
          return merged;
        }
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

    // 合并历史健康度数据到网关
    const gatewaysWithHistory = allGateways.map((g) => ({
      ...g,
      ...healthHistory[g.name],
    }));

    // 执行检测
    const results = await this.testAllGateways(gatewaysWithHistory, {
      onProgress,
      priorityRegions,
    });

    // 保存结果和健康度历史
    this.cacheResults(results);
    this.saveHealthHistory(results);

    return results;
  },

  // 加载健康度历史
  loadHealthHistory(): Record<string, Partial<Gateway>> {
    try {
      const stored = localStorage.getItem(CONFIG.GATEWAY_HEALTH.HEALTH_CACHE_KEY);
      if (!stored) return {};

      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp > CONFIG.GATEWAY_HEALTH.HEALTH_CACHE_EXPIRY) {
        return {};
      }

      return data.history || {};
    } catch {
      return {};
    }
  },

  // 保存健康度历史
  saveHealthHistory(gateways: Gateway[]): void {
    try {
      const history: Record<string, Partial<Gateway>> = {};
      gateways.forEach((g) => {
        history[g.name] = {
          healthScore: g.healthScore,
          failureCount: g.failureCount,
          consecutiveFailures: g.consecutiveFailures,
          lastSuccess: g.lastSuccess,
          lastChecked: g.lastChecked,
        };
      });

      localStorage.setItem(
        CONFIG.GATEWAY_HEALTH.HEALTH_CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          history,
        })
      );
    } catch {
      // 忽略存储错误
    }
  },

  // 智能获取最优网关（自动检测）
  async getBestGatewayUrl(
    customGateways: Gateway[] = [],
    options: {
      requireRangeSupport?: boolean;
      requireCors?: boolean;
      minHealthScore?: number;
    } = {}
  ): Promise<{ url: string; gateway: Gateway | null }> {
    const { requireRangeSupport = false, requireCors = false, minHealthScore = 30 } = options;

    const results = await this.autoTestGateways(customGateways);

    // 过滤符合条件的网关
    let availableGateways = results.filter((g) => g.available);

    // 应用额外筛选条件
    if (requireRangeSupport) {
      availableGateways = availableGateways.filter((g) => g.rangeSupport);
    }
    if (requireCors) {
      availableGateways = availableGateways.filter((g) => g.corsEnabled);
    }
    if (minHealthScore > 0) {
      availableGateways = availableGateways.filter((g) => (g.healthScore || 0) >= minHealthScore);
    }

    if (availableGateways.length > 0) {
      // 综合评分排序：健康度 > 可靠性 > 延迟
      const bestGateway = availableGateways.sort((a, b) => {
        // 健康度优先
        const healthDiff = (b.healthScore || 0) - (a.healthScore || 0);
        if (healthDiff !== 0) return healthDiff;

        // 可靠性次之
        const reliabilityDiff = (b.reliability || 0) - (a.reliability || 0);
        if (reliabilityDiff !== 0) return reliabilityDiff;

        // 延迟最后
        return (a.latency || Infinity) - (b.latency || Infinity);
      })[0];

      return { url: bestGateway.url, gateway: bestGateway };
    }

    // 如果没有符合条件的网关，尝试放宽条件
    const fallbackGateways = results.filter((g) => g.available);
    if (fallbackGateways.length > 0) {
      const best = fallbackGateways.sort(
        (a, b) => (a.latency || Infinity) - (b.latency || Infinity)
      )[0];
      return { url: best.url, gateway: best };
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

// 文件传播 API - 上传后主动传播到其他网关
export const propagationApi = {
  /**
   * 传播文件到多个网关
   * 通过向每个网关发送 HEAD 请求来预热/传播文件
   */
  async propagateToGateways(
    cid: string,
    gateways: Gateway[],
    options: {
      maxConcurrent?: number;
      timeout?: number;
      onProgress?: (gateway: Gateway, status: 'pending' | 'success' | 'failed') => void;
    } = {}
  ): Promise<{
    success: Gateway[];
    failed: Gateway[];
    total: number;
  }> {
    const { maxConcurrent = 5, timeout = 15000, onProgress } = options;
    
    // 过滤出可用的网关
    const availableGateways = gateways.filter(g => g.available);
    if (availableGateways.length === 0) {
      return { success: [], failed: [], total: 0 };
    }

    const success: Gateway[] = [];
    const failed: Gateway[] = [];

    // 使用队列控制并发
    const queue = [...availableGateways];
    const executing: Set<Promise<void>> = new Set();

    const propagateToGateway = async (gateway: Gateway): Promise<void> => {
      onProgress?.(gateway, 'pending');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // 使用 HEAD 请求来预热网关缓存
        const response = await fetch(`${gateway.url}${cid}`, {
          method: 'HEAD',
          signal: controller.signal,
          // 添加缓存控制头，确保获取最新内容
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          success.push(gateway);
          onProgress?.(gateway, 'success');
        } else {
          failed.push(gateway);
          onProgress?.(gateway, 'failed');
        }
      } catch {
        failed.push(gateway);
        onProgress?.(gateway, 'failed');
      }
    };

    // 并发控制处理
    while (queue.length > 0 || executing.size > 0) {
      while (executing.size < maxConcurrent && queue.length > 0) {
        const gateway = queue.shift()!;
        const promise = propagateToGateway(gateway).finally(() => {
          executing.delete(promise);
        });
        executing.add(promise);
      }

      if (executing.size > 0) {
        await Promise.race(executing);
      }
    }

    return {
      success,
      failed,
      total: availableGateways.length,
    };
  },

  /**
   * 智能传播 - 优先传播到延迟低的网关
   */
  async smartPropagate(
    cid: string,
    gateways: Gateway[],
    options: {
      maxGateways?: number;
      timeout?: number;
      onProgress?: (gateway: Gateway, status: 'pending' | 'success' | 'failed') => void;
    } = {}
  ): Promise<{
    success: Gateway[];
    failed: Gateway[];
    total: number;
  }> {
    const { maxGateways = 8, timeout = 15000, onProgress } = options;
    
    // 按延迟排序，优先传播到延迟低的网关
    const sortedGateways = gateways
      .filter(g => g.available)
      .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity))
      .slice(0, maxGateways);

    return this.propagateToGateways(cid, sortedGateways, {
      maxConcurrent: 5,
      timeout,
      onProgress,
    });
  },

  /**
   * 后台静默传播 - 不阻塞主流程
   */
  backgroundPropagate(
    cid: string,
    gateways: Gateway[],
    options: {
      maxGateways?: number;
      timeout?: number;
      onComplete?: (result: { success: Gateway[]; failed: Gateway[]; total: number }) => void;
    } = {}
  ): void {
    // 使用 setTimeout 确保不阻塞当前执行栈
    setTimeout(() => {
      this.smartPropagate(cid, gateways, options).then((result) => {
        options.onComplete?.(result);
        console.log(`[Propagation] CID ${cid.slice(0, 16)}... propagated to ${result.success.length}/${result.total} gateways`);
      }).catch((error) => {
        console.error(`[Propagation] Failed for CID ${cid.slice(0, 16)}...:`, error);
      });
    }, 100);
  },
};

export { ApiError };
