import { CONFIG, API } from "../config";
import { secureFetch } from "./base";

// Crust API 端点
const CRUST_UPLOAD_API = 'https://gw.crustfiles.app/api/v0/add?pin=true';
const CRUST_ORDER_API = 'https://gw.crustfiles.app/crust/api/v1/files';

export const uploadApi = {
  /**
   * 直连上传到 Crust API
   * 避免代理服务器的大小限制
   */
  async uploadToCrust(
    file: File,
    token: string,
    onProgress: (progress: number) => void
  ): Promise<{ cid: string; size: number; hash?: string; orderCreated?: boolean }> {
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
            // Crust API 返回 { Hash, Size }
            if (response.Hash) {
              const cid = response.Hash;
              const size = response.Size || file.size;
              
              // 上传成功后，创建存储订单
              this.createOrder(cid, size, token)
                .then((orderCreated) => {
                  resolve({
                    cid,
                    size,
                    hash: response.Hash,
                    orderCreated,
                  });
                })
                .catch((err) => {
                  // 订单创建失败不影响上传结果
                  console.warn("创建存储订单失败:", err);
                  resolve({
                    cid,
                    size,
                    hash: response.Hash,
                    orderCreated: false,
                  });
                });
            } else {
              reject(new Error(response.error || "上传失败：无效响应"));
            }
          } catch (parseError) {
            console.error("解析上传响应失败:", parseError, xhr.responseText);
            reject(new Error("解析响应失败"));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || errorResponse.message || `上传失败: ${xhr.status}`));
          } catch {
            reject(new Error(`上传失败: ${xhr.statusText || xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("网络错误，请检查网络连接"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("上传已取消"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("上传超时"));
      });

      xhr.timeout = CONFIG.UPLOAD.TIMEOUT;
      
      const formData = new FormData();
      formData.append("file", file);
      
      // 直连 Crust API
      xhr.open("POST", CRUST_UPLOAD_API);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  /**
   * 创建存储订单
   */
  async createOrder(cid: string, size: number, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${CRUST_ORDER_API}/${cid}/order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cid,
          size,
          months: 1200,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("创建存储订单失败:", error);
      return false;
    }
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
    } catch (error) {
      console.warn("文件验证请求失败:", error);
      return { verified: false, status: "pending", message: "验证超时" };
    }
  },
};

export const tokenApi = {
  async getToken(): Promise<string> {
    const response = await secureFetch(API.GET_TOKEN);
    const data = await response.json();
    return data.data?.token || data.token;
  },
};
