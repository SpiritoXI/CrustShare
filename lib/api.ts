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
    return data.token;
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
      xhr.setRequestHeader("Authorization", token);
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
    const testGateway = async (gateway: Gateway): Promise<Gateway> => {
      const result = await this.testGateway(gateway);
      return {
        ...gateway,
        available: result.available,
        latency: result.latency,
        lastChecked: Date.now(),
      };
    };

    const batchSize = CONFIG.GATEWAY_TEST.CONCURRENT_LIMIT;
    const results: Gateway[] = [];

    for (let i = 0; i < gateways.length; i += batchSize) {
      const batch = gateways.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(testGateway));
      results.push(...batchResults);
    }

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
};

export { ApiError };
