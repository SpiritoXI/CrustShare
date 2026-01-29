import { NextRequest, NextResponse } from 'next/server';

/**
 * CrustFiles.io 正向代理路由
 * 完整透传所有请求到 crustfiles.io，保持鉴权状态
 */

const CRUSTFILES_BASE_URL = process.env.CRUSTFILES_BASE_URL || 'https://crustfiles.io';

// Hop-by-hop headers that should not be forwarded
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
]);

/**
 * 过滤请求头
 * 移除 hop-by-hop headers 和一些不应该转发的 headers
 */
function filterHeaders(headers: Headers): Headers {
  const filtered = new Headers();

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    // 跳过 hop-by-hop headers
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      return;
    }

    // 跳过 host（使用目标服务器的 host）
    if (lowerKey === 'host') {
      return;
    }

    // 保留其他 headers
    filtered.append(key, value);
  });

  return filtered;
}

/**
 * 过滤响应头
 * 移除一些不应该转发的 headers
 */
function filterResponseHeaders(headers: Headers): Headers {
  const filtered = new Headers();

  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    // 跳过 hop-by-hop headers
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
      return;
    }

    // 保留 CORS 相关 headers（但会被 Next.js 重新设置）
    if (lowerKey === 'access-control-allow-origin' ||
        lowerKey === 'access-control-allow-methods' ||
        lowerKey === 'access-control-allow-headers' ||
        lowerKey === 'access-control-allow-credentials') {
      return;
    }

    // 保留其他 headers
    filtered.append(key, value);
  });

  return filtered;
}

/**
 * 处理 OPTIONS 请求（CORS 预检）
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

/**
 * 通用代理处理函数
 */
async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // 获取代理路径
    const path = request.nextUrl.pathname.replace('/api/proxy', '');
    const searchParams = request.nextUrl.search;
    const targetUrl = `${CRUSTFILES_BASE_URL}${path}${searchParams}`;

    console.log(`[Proxy] ${request.method} ${targetUrl}`);

    // 准备请求头
    const requestHeaders = filterHeaders(request.headers);

    // 准备请求选项
    const options: RequestInit = {
      method: request.method,
      headers: requestHeaders,
    };

    // 处理请求体（GET/HEAD 请求没有 body）
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // 对于 multipart/form-data，直接传递 request.body
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('multipart/form-data')) {
        options.body = request.body;
      } else {
        // 对于其他类型，读取 body
        options.body = await request.text();
      }
    }

    // 发送请求到 CrustFiles.io
    const response = await fetch(targetUrl, options);

    // 准备响应头
    const responseHeaders = filterResponseHeaders(response.headers);

    // 获取响应体
    let body;
    const contentType = responseHeaders.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // JSON 响应
      body = await response.text();
    } else if (contentType.includes('text/')) {
      // 文本响应
      body = await response.text();
    } else {
      // 二进制响应（文件流）
      body = response.body;
    }

    // 返回响应
    const nextResponse = new NextResponse(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

    // 添加 CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');

    return nextResponse;
  } catch (error) {
    console.error('[Proxy Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: '代理请求失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET 请求代理
 */
export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

/**
 * POST 请求代理
 */
export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

/**
 * PUT 请求代理
 */
export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

/**
 * DELETE 请求代理
 */
export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

/**
 * PATCH 请求代理
 */
export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}
