import type { ApiResponse } from "../../types";

interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_PASSWORD_HASH?: string;
  CRUST_TOKEN: string;
}

interface Context {
  request: Request;
  env: Env;
}

/**
 * 使用 SHA-256 对密码进行哈希
 * @param password - 明文密码
 * @returns 哈希后的密码（十六进制字符串）
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证密码
 * @param password - 用户输入的明文密码
 * @param hash - 存储的哈希值
 * @returns 是否匹配
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  // 使用 timing-safe 比较防止时序攻击
  if (computedHash.length !== hash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 验证认证 - 支持明文密码和哈希密码
 */
async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get("x-auth-token");

  if (!authHeader) {
    return false;
  }

  // 优先使用 ADMIN_PASSWORD_HASH（更安全）
  if (env.ADMIN_PASSWORD_HASH) {
    return await verifyPassword(authHeader, env.ADMIN_PASSWORD_HASH);
  }

  // 回退到 ADMIN_PASSWORD（明文）
  if (env.ADMIN_PASSWORD) {
    return authHeader === env.ADMIN_PASSWORD;
  }

  return false;
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context;

  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const crustToken = env.CRUST_TOKEN;
  if (!crustToken) {
    return new Response(
      JSON.stringify({ success: false, error: "CRUST_TOKEN未配置" } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data: { token: crustToken } } as ApiResponse<{ token: string }>),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
