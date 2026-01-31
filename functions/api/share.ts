import type { ApiResponse } from "../../types";

const SHARES_KEY = "crustshare_shares";

interface Env {
  UPSTASH_URL: string;
  UPSTASH_TOKEN: string;
  ADMIN_PASSWORD?: string;
  ADMIN_PASSWORD_HASH?: string;
}

interface Context {
  request: Request;
  env: Env;
}

interface ShareInfo {
  cid: string;
  filename?: string;
  size?: number;
  password?: string;
  expiry?: string;
  createdAt: number;
}

// CORS 响应头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-auth-token",
};

// 处理 CORS 预检请求
function handleCors(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

async function upstashCommand<T = unknown>(
  upstashUrl: string,
  upstashToken: string,
  command: (string | number)[]
): Promise<T> {
  if (!upstashUrl || !upstashToken) {
    throw new Error("Upstash配置缺失");
  }

  const response = await fetch(upstashUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${upstashToken}`,
    },
    body: JSON.stringify(command),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Upstash错误: ${response.status}`);
  }

  return data.result;
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

// GET: 获取分享信息（公开访问，不需要认证）
export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context;

  // 处理 CORS 预检请求
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const url = new URL(request.url);
  const cid = url.searchParams.get("cid");

  if (!cid) {
    return new Response(
      JSON.stringify({ success: false, error: "缺少CID参数" } as ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const result = await upstashCommand<string | null>(
      env.UPSTASH_URL,
      env.UPSTASH_TOKEN,
      ["HGET", SHARES_KEY, cid]
    );

    if (!result) {
      // 如果找不到分享信息，返回基本信息（允许通过CID直接访问）
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            cid,
            hasPassword: false,
          },
        } as ApiResponse),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const shareInfo: ShareInfo = JSON.parse(result);

    // 检查是否过期
    if (shareInfo.expiry && shareInfo.expiry !== "0") {
      const expiryDays = parseInt(shareInfo.expiry);
      const expiryTime = shareInfo.createdAt + expiryDays * 24 * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        // 删除过期的分享
        await upstashCommand(
          env.UPSTASH_URL,
          env.UPSTASH_TOKEN,
          ["HDEL", SHARES_KEY, cid]
        );
        return new Response(
          JSON.stringify({ success: false, error: "分享已过期" } as ApiResponse),
          { status: 410, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // 返回分享信息（不包含密码）
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          cid: shareInfo.cid,
          filename: shareInfo.filename,
          size: shareInfo.size,
          hasPassword: !!shareInfo.password,
          expiry: shareInfo.expiry,
        },
      } as ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "获取分享信息失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

// POST: 创建或更新分享（需要认证）
export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context;

  // 处理 CORS 预检请求
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await request.json() as ShareInfo;

    if (!body.cid) {
      return new Response(
        JSON.stringify({ success: false, error: "缺少CID" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const shareInfo: ShareInfo = {
      cid: body.cid,
      filename: body.filename,
      size: body.size,
      password: body.password,
      expiry: body.expiry,
      createdAt: Date.now(),
    };

    await upstashCommand(
      env.UPSTASH_URL,
      env.UPSTASH_TOKEN,
      ["HSET", SHARES_KEY, body.cid, JSON.stringify(shareInfo)]
    );

    return new Response(
      JSON.stringify({ success: true } as ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "保存分享信息失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

// DELETE: 删除分享（需要认证）
export async function onRequestDelete(context: Context): Promise<Response> {
  const { request, env } = context;

  // 处理 CORS 预检请求
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // 验证认证
  if (!(await verifyAuth(request, env))) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const url = new URL(request.url);
  const cid = url.searchParams.get("cid");

  if (!cid) {
    return new Response(
      JSON.stringify({ success: false, error: "缺少CID参数" } as ApiResponse),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    await upstashCommand(
      env.UPSTASH_URL,
      env.UPSTASH_TOKEN,
      ["HDEL", SHARES_KEY, cid]
    );

    return new Response(
      JSON.stringify({ success: true } as ApiResponse),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "删除分享失败";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
