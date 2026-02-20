import { CONFIG, API } from "../config";
import { secureFetch } from "./base";

// ============================================
// Crust Network 上传端点配置
// ============================================
// 多个备用端点，自动故障转移
const CRUST_UPLOAD_ENDPOINTS = [
  {
    name: 'crustfiles-app',
    upload: 'https://gw.crustfiles.app/api/v0/add?pin=true',
    order: 'https://gw.crustfiles.app/crust/api/v1/files',
  },
  {
    name: 'decoo-main',
    upload: 'https://gw.decoo.io/api/v0/add?pin=true',
    order: 'https://gw.decoo.io/crust/api/v1/files',
  },
  {
    name: 'decoo-hk',
    upload: 'https://ipfs-hk.decoo.io/api/v0/add?pin=true',
    order: 'https://ipfs-hk.decoo.io/crust/api/v1/files',
  },
  {
    name: 'crust-gateway',
    upload: 'https://crustgateway.com/api/v0/add?pin=true',
    order: 'https://crustgateway.com/crust/api/v1/files',
  },
];

// 上传版本号 - 用于确认代码是否更新
const UPLOAD_VERSION = '3.3.3-multi-endpoint';

export const uploadApi = {
  /**
   * 直连上传到 Crust API（多端点自动故障转移）
   * 
   * 特性:
   * - 多个备用端点，自动故障转移
   * - 直连上传，绕过代理服务器限制
   * - 支持 CORS，前端直连无问题
   * 
   * 版本: 3.3.3-multi-endpoint
   */
  async uploadToCrust(
    file: File,
    token: string,
    onProgress: (progress: number) => void
  ): Promise<{ cid: string; size: number; hash?: string; orderCreated?: boolean }> {
    console.log(`[CrustShare v${UPLOAD_VERSION}] 开始多端点上传`);
    console.log(`[CrustShare] 文件: ${file.name}, 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    console.log(`[CrustShare] 可用端点: ${CRUST_UPLOAD_ENDPOINTS.map(e => e.name).join(', ')}`);
    
    const errors: string[] = [];
    
    // 依次尝试每个端点
    for (let i = 0; i < CRUST_UPLOAD_ENDPOINTS.length; i++) {
      const endpoint = CRUST_UPLOAD_ENDPOINTS[i];
      console.log(`[CrustShare] 尝试端点 ${i + 1}/${CRUST_UPLOAD_ENDPOINTS.length}: ${endpoint.name}`);
      console.log(`[CrustShare] 上传 URL: ${endpoint.upload}`);
      
      try {
        const result = await this.uploadToEndpoint(file, token, endpoint.upload, endpoint.order, onProgress);
        console.log(`[CrustShare] 端点 ${endpoint.name} 上传成功!`);
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[CrustShare] 端点 ${endpoint.name} 失败: ${errorMsg}`);
        errors.push(`${endpoint.name}: ${errorMsg}`);
        
        // 如果不是最后一个端点，继续尝试下一个
        if (i < CRUST_UPLOAD_ENDPOINTS.length - 1) {
          console.log(`[CrustShare] 切换到下一个端点...`);
        }
      }
    }
    
    // 所有端点都失败了
    console.error(`[CrustShare] 所有端点都失败!`);
    throw new Error(`上传失败，已尝试所有端点:\n${errors.join('\n')}`);
  },

  /**
   * 上传到指定端点
   */
  async uploadToEndpoint(
    file: File,
    token: string,
    uploadUrl: string,
    orderUrl: string,
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
            
            if (response.Hash) {
              const cid = response.Hash;
              const size = response.Size || file.size;
              
              // 上传成功后，创建存储订单
              this.createOrder(cid, size, token, orderUrl)
                .then((orderCreated) => {
                  resolve({
                    cid,
                    size,
                    hash: response.Hash,
                    orderCreated,
                  });
                })
                .catch(() => {
                  // 订单创建失败不影响上传结果
                  resolve({
                    cid,
                    size,
                    hash: response.Hash,
                    orderCreated: false,
                  });
                });
            } else if (response.error) {
              reject(new Error(response.error));
            } else if (response.Message) {
              reject(new Error(response.Message));
            } else {
              reject(new Error("上传失败：无效响应"));
            }
          } catch (parseError) {
            reject(new Error(`解析响应失败: ${xhr.responseText.substring(0, 100)}`));
          }
        } else {
          // 解析错误信息
          let errorMsg = `HTTP ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMsg = errorResponse.error || errorResponse.message || errorResponse.Message || errorMsg;
          } catch {
            if (xhr.statusText) {
              errorMsg = xhr.statusText;
            }
          }
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("网络错误"));
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
      
      // 直连上传
      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  },

  /**
   * 创建存储订单
   */
  async createOrder(cid: string, size: number, token: string, orderUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${orderUrl}/${cid}/order`, {
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
