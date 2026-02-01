// Cloudflare Pages Function - 处理下载页面的动态路由
export async function onRequest(context: { request: Request; env: unknown }): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  // 获取 CID 从路径中
  const pathParts = url.pathname.split('/').filter(Boolean);
  const cid = pathParts[pathParts.length - 1];

  // 获取查询参数
  const filename = url.searchParams.get('filename') || '';
  const size = url.searchParams.get('size') || '';

  // 返回下载页面的 HTML，CID 将在客户端通过 JavaScript 解析
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrustShare - 下载文件</title>
  <meta name="description" content="去中心化文件存储与分享平台 - 下载文件">
  <script>
    // 将 CID 和文件信息存储在全局变量中，供 React 应用使用
    window.__DOWNLOAD_CID__ = "${cid || ''}";
    window.__DOWNLOAD_FILENAME__ = "${filename}";
    window.__DOWNLOAD_SIZE__ = "${size}";
  </script>
</head>
<body>
  <div id="__next"></div>
  <script src="/_next/static/chunks/main-app.js"></script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}
