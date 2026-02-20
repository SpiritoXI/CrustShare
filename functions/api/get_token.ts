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
 * 注意：CRUST_ACCESS_TOKEN 在后端直接使用，不需要传递给前端
 * 此 API 仅用于兼容前端调用，返回成功状态即可
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

  // 返回成功响应（token 在后端使用，不传递给前端）
  return new Response(
    JSON.stringify({ 
      success: true, 
      data: { token: "authenticated" } 
    } as ApiResponse<{ token: string }>),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
  );
}
