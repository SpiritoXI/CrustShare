import type { ApiResponse } from "../../types";

interface Env {
  ADMIN_PASSWORD: string;
}

interface Context {
  request: Request;
  env: Env;
}

interface VerifyPasswordBody {
  password: string;
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
      hasAdminPassword: !!env.ADMIN_PASSWORD,
      passwordLength: env.ADMIN_PASSWORD?.length
    });

    let body: VerifyPasswordBody;
    try {
      body = await request.json() as VerifyPasswordBody;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: "请求格式错误：无法解析 JSON" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const { password } = body;
    const expectedPassword = env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      console.error('ADMIN_PASSWORD not set');
      return new Response(
        JSON.stringify({ success: false, error: "服务器配置错误：未设置 ADMIN_PASSWORD" } as ApiResponse),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 输入验证
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "密码格式不正确" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 密码长度验证
    if (password.length < 1 || password.length > 128) {
      return new Response(
        JSON.stringify({ success: false, error: "密码长度不合法" } as ApiResponse),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 明文密码比较
    const isValid = password === expectedPassword;

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
        JSON.stringify({ success: false, error: "密码错误" } as ApiResponse),
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
      JSON.stringify({ success: false, error: "请求处理失败", message: errorMessage } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
