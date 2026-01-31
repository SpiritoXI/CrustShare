import type { ApiResponse } from "../../types";

interface Env {
  ADMIN_PASSWORD: string;
  CRUST_TOKEN: string;
}

interface Context {
  request: Request;
  env: Env;
}

/**
 * 验证认证 - 使用明文密码
 */
async function verifyAuth(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get("x-auth-token");

  if (!authHeader) {
    return false;
  }

  // 明文密码比较
  return authHeader === env.ADMIN_PASSWORD;
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
