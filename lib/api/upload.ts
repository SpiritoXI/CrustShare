import { CONFIG, API } from "../config";
import { secureFetch } from "./base";

// Crust API 端点 - 直连上传
const CRUST_UPLOAD_API = 'https://gw.crustfiles.app/api/v0/add?pin=true';
const CRUST_ORDER_API = 'https://gw.crustfiles.app/crust/api/v1/files';

// 上传版本号 - 用于确认代码是否更新
const UPLOAD_VERSION = '3.3.2-direct';

export const uploadApi = {
  /**
   * 直连上传到 Crust API
   * 避免代理服务器的大小限制
   * 
   * 版本: 3.3.2-direct
   * 端点: https://gw.crustfiles.app/api/v0/add
   */
  async uploadToCrust(
    file: File,
    token: string,
    onProgress: (progress: number) => void
  ): Promise<{ cid: string; size: number; hash?: string; orderCreated?: boolean }> {
    // 调试信息 - 确认使用直连上传
    console.log(`[CrustShare v${UPLOAD_VERSION}] 直连上传到 Crust API`);
    console.log(`[CrustShare] 上传端点: ${CRUST_UPLOAD_API}`);
    console.log(`[CrustShare] 文件名: ${file.name}, 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        console.log(`[CrustShare] 上传响应状态: ${xhr.status}`);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log(`[CrustShare] 上传响应:`, response);
            
            // Crust API 返回 { Hash, Size }
            if (response.Hash) {
              const cid = response.Hash;
              const size = response.Size || file.size;
              
              console.log(`[CrustShare] 上传成功! CID: ${cid}`);
              
              // 上传成功后，创建存储订单
              this.createOrder(cid, size, token)
                .then((orderCreated) => {
                  console.log(`[CrustShare] 存储订单创建: ${orderCreated ? '成功' : '跳过'}`);
                  resolve({
                    cid,
                    size,
                    hash: response.Hash,
                    orderCreated,
                  });
                })
                .catch((err) => {
                  // 订单创建失败不影响上传结果
                  console.warn("[CrustShare] 创建存储订单失败:", err);
                  resolve({
                    cid,
                    size,
                    hash: response.Hash,
                    orderCreated: false,
                  });
                });
            } else if (response.error) {
              console.error(`[CrustShare] 上传失败: ${response.error}`);
              reject(new Error(response.error));
            } else {
              console.error(`[CrustShare] 无效响应:`, response);
              reject(new Error("上传失败：无效响应"));
            }
          } catch (parseError) {
            console.error("[CrustShare] 解析响应失败:", parseError, xhr.responseText);
            reject(new Error("解析响应失败"));
          }
        } else {
          console.error(`[CrustShare] 上传失败: ${xhr.status} ${xhr.statusText}`);
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || errorResponse.message || `上传失败: ${xhr.status}`));
          } catch {
            reject(new Error(`上传失败: ${xhr.statusText || xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        console.error("[CrustShare] 网络错误");
        reject(new Error("网络错误，请检查网络连接"));
      });

      xhr.addEventListener("abort", () => {
        console.log("[CrustShare] 上传已取消");
        reject(new Error("上传已取消"));
      });

      xhr.addEventListener("timeout", () => {
        console.error("[CrustShare] 上传超时");
        reject(new Error("上传超时"));
      });

      xhr.timeout = CONFIG.UPLOAD.TIMEOUT;
      
      const formData = new FormData();
      formData.append("file", file);
      
      // 直连 Crust API - 关键！
      xhr.open("POST", CRUST_UPLOAD_API);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
      
      console.log(`[CrustShare] 已发送上传请求到: ${CRUST_UPLOAD_API}`);
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
