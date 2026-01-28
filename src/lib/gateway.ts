// 网关配置
export interface Gateway {
  name: string;
  url: string;
  priority: number;
  responseTime?: number;
  status?: 'available' | 'unavailable' | 'checking';
  lastChecked?: Date;
}

export const GATEWAYS: Gateway[] = [
  {
    name: 'Cloudflare IPFS',
    url: 'https://cloudflare-ipfs.com/ipfs/',
    priority: 1,
  },
  {
    name: 'IPFS.io',
    url: 'https://ipfs.io/ipfs/',
    priority: 2,
  },
  {
    name: 'DWeb Link',
    url: 'https://dweb.link/ipfs/',
    priority: 3,
  },
  {
    name: 'W3S Link',
    url: 'https://w3s.link/ipfs/',
    priority: 4,
  },
  {
    name: 'Crust Network',
    url: 'https://crustwebsites.net/ipfs/',
    priority: 5,
  },
];

// 测试网关可用性
export async function testGateway(gateway: Gateway): Promise<Gateway> {
  const startTime = performance.now();

  try {
    // 使用 HEAD 请求测试网关响应
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

    const response = await fetch(gateway.url + 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = performance.now() - startTime;

    if (response.ok) {
      return {
        ...gateway,
        responseTime,
        status: 'available',
        lastChecked: new Date(),
      };
    } else {
      return {
        ...gateway,
        status: 'unavailable',
        lastChecked: new Date(),
      };
    }
  } catch (error) {
    return {
      ...gateway,
      status: 'unavailable',
      lastChecked: new Date(),
    };
  }
}

// 测试所有网关
export async function testAllGateways(): Promise<Gateway[]> {
  const results = await Promise.all(GATEWAYS.map(testGateway));
  return results.filter((g) => g.status === 'available').sort((a, b) => {
    if (!a.responseTime || !b.responseTime) return 0;
    return a.responseTime - b.responseTime;
  });
}

// 获取最佳网关
export async function getBestGateway(): Promise<Gateway | null> {
  // 检查缓存
  const cacheKey = 'gateway_cache';
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    const data = JSON.parse(cached);
    const cacheTime = new Date(data.timestamp);
    const now = new Date();

    // 缓存有效期为 10 分钟
    if (now.getTime() - cacheTime.getTime() < 10 * 60 * 1000) {
      return data.gateway;
    }
  }

  // 没有缓存或缓存过期，重新测试
  const gateways = await testAllGateways();

  if (gateways.length === 0) {
    return null;
  }

  const bestGateway = gateways[0];

  // 更新缓存
  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      gateway: bestGateway,
      timestamp: new Date().toISOString(),
    })
  );

  return bestGateway;
}

// 生成下载链接
export function getDownloadUrl(cid: string, gateway?: Gateway): string {
  const gw = gateway || { url: 'https://cloudflare-ipfs.com/ipfs/' };
  return `${gw.url}${cid}`;
}
