// Cloudflare Pages Function - 处理分享页面的动态路由
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // 获取 CID 从路径中
  const pathParts = url.pathname.split('/').filter(Boolean);
  const cid = pathParts[pathParts.length - 1];

  try {
    // 从 ASSETS 中获取生成的 HTML 文件
    const assetUrl = new URL('/share/placeholder/index.html', url.origin);
    const response = await env.ASSETS.fetch(assetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status}`);
    }

    let html = await response.text();

    // 在 </head> 前注入全局变量脚本
    const injectScript = `<script>
  window.__SHARE_CID__ = "${cid || ''}";
</script>`;

    html = html.replace('</head>', `${injectScript}</head>`);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  } catch (error) {
    console.error('Error serving share page:', error);
    
    // 降级方案：返回简单的错误页面
    return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrustShare - 文件分享</title>
  <script>
    window.__SHARE_CID__ = "${cid || ''}";
  </script>
  <script src="/_next/static/chunks/main-app-cf26c096f2c84409.js" async crossorigin></script>
</head>
<body>
  <div id="__next"></div>
</body>
</html>`, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  }
}

interface Env {
  ASSETS: {
    fetch: (request: Request | URL) => Promise<Response>;
  };
}
