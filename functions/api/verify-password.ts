import type { ApiResponse } from "../../types";

interface Env {
  ADMIN_PASSWORD_HASH: string;
}

interface Context {
  request: Request;
  env: Env;
}

interface VerifyPasswordBody {
  password: string;
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
 * 验证密码 - 支持明文或哈希值
 * @param password - 用户输入的密码（可能是明文或哈希值）
 * @param hash - 存储的哈希值
 * @returns 是否匹配
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // 如果密码长度是 64（SHA-256 哈希值的长度），直接比较
  if (password.length === 64) {
    // 使用 timing-safe 比较
    if (password.length !== hash.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < password.length; i++) {
      result |= password.charCodeAt(i) ^ hash.charCodeAt(i);
    }
    return result === 0;
  }

  // 否则，将密码进行哈希后再比较
  const computedHash = await hashPassword(password);
  if (computedHash.length !== hash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

// CORS 响应头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context;

  try {
    // 检查环境变量
    console.log('Environment check:', {
      hasAdminPasswordHash: !!env.ADMIN_PASSWORD_HASH,
      hashLength: env.ADMIN_PASSWORD_HASH?.length
    });

    let body: VerifyPasswordBody;
    try {
      body = await request.json() as VerifyPasswordBody;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: "请求格式错误：无法解析 JSON" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const { password } = body;
    const expectedPasswordHash = env.ADMIN_PASSWORD_HASH;

    if (!expectedPasswordHash) {
      console.error('ADMIN_PASSWORD_HASH not set');
      return new Response(
        JSON.stringify({ error: "服务器配置错误：未设置 ADMIN_PASSWORD_HASH" } as ApiResponse),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 输入验证
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: "密码格式不正确" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 密码长度验证（支持明文或哈希值）
    if (password.length < 1 || password.length > 128) {
      return new Response(
        JSON.stringify({ error: "密码长度不合法" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, expectedPasswordHash);

    if (isValid) {
      return new Response(
        JSON.stringify({ success: true } as ApiResponse),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            ...corsHeaders
          }
        }
      );
    } else {
      // 添加延迟防止暴力破解
      await new Promise(resolve => setTimeout(resolve, 500));

      return new Response(
        JSON.stringify({ error: "密码错误" } as ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            ...corsHeaders
          }
        }
      );
    }
  } catch (error) {
    console.error('密码验证错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return new Response(
      JSON.stringify({ error: "请求处理失败", details: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
