import type { ApiResponse, Env, Context } from "../../types";

// CORS 响应头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-auth-token",
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * 获取上传令牌
 * 
 * 返回 CRUST_ACCESS_TOKEN 用于前端直连上传
 * 这样可以避免代理服务器的大小限制（413 错误）
 */
export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context;

  // 验证用户认证
  const authHeader = request.headers.get("x-auth-token");
  if (!authHeader || authHeader !== env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ success: false, error: "未授权" } as ApiResponse),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // 检查 CRUST_ACCESS_TOKEN 是否已配置
  if (!env.CRUST_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ success: false, error: "CRUST_ACCESS_TOKEN未配置" } as ApiResponse),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // 返回真实的 CRUST_ACCESS_TOKEN
  // 用于前端直连上传，避免代理服务器大小限制
  return new Response(
    JSON.stringify({ 
      success: true, 
      data: { token: env.CRUST_ACCESS_TOKEN } 
    } as ApiResponse<{ token: string }>),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}
