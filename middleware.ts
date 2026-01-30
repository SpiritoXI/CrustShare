import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 允许的 CORS 来源列表
 * 生产环境应该限制为实际域名
 */
const ALLOWED_ORIGINS = [
  // 生产环境域名
  'https://crustshare.com',
  'https://www.crustshare.com',
  // 开发环境
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Cloudflare Pages 预览域名
  'https://crustshare.pages.dev',
];

/**
 * 检查来源是否在允许列表中
 * @param origin - 请求来源
 * @returns 是否允许
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // 精确匹配
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // 允许子域名
  const allowedDomains = ALLOWED_ORIGINS.map(url => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  });
  
  try {
    const originHostname = new URL(origin).hostname;
    return allowedDomains.some(domain => 
      originHostname === domain || originHostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * 获取允许的 CORS 来源
 * @param request - Next.js 请求对象
 * @returns 允许的来源或 null
 */
function getCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  
  // 如果没有 origin 头（如同源请求），返回 null
  if (!origin) return null;
  
  // 检查是否在允许列表中
  if (isAllowedOrigin(origin)) {
    return origin;
  }
  
  // 开发环境允许所有来源
  if (process.env.NODE_ENV === 'development') {
    return origin;
  }
  
  return null;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const corsOrigin = getCorsOrigin(request);

  // CORS headers - 只允许特定来源
  if (corsOrigin) {
    response.headers.set("Access-Control-Allow-Origin", corsOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-auth-token, x-csrf-token"
  );
  response.headers.set(
    "Access-Control-Max-Age",
    "86400" // 24 小时
  );

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // 添加额外的安全头
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // CSP (Content Security Policy)
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "media-src 'self' https: blob:",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: [
    // 匹配所有 API 路由
    '/api/:path*',
    // 匹配所有页面
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
