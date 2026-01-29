/**
 * 网关初始化配置
 * 默认配置多个第三方 IPFS 网关
 */

import { GatewayConfig, GatewayType } from './types';
import { getGatewayManager } from './manager';

/**
 * 默认网关配置列表
 */
const DEFAULT_GATEWAYS: GatewayConfig[] = [
  {
    id: 'ipfs-io',
    name: 'IPFS.io Gateway',
    type: GatewayType.IPFS,
    url: 'https://ipfs.io',
    priority: 1,
    enabled: true,
    authRequired: false,
    timeout: 5000,
    maxRetries: 3,
  },
  {
    id: 'dweb-link',
    name: 'dweb.link Gateway',
    type: GatewayType.IPFS,
    url: 'https://dweb.link',
    priority: 2,
    enabled: true,
    authRequired: false,
    timeout: 5000,
    maxRetries: 3,
  },
  {
    id: 'ipfs-gateway-cf-ipfs-com',
    name: 'Cloudflare IPFS Gateway',
    type: GatewayType.IPFS,
    url: 'https://cloudflare-ipfs.com',
    priority: 3,
    enabled: true,
    authRequired: false,
    timeout: 5000,
    maxRetries: 3,
  },
  {
    id: 'ipfs-jbo-eth-limo',
    name: 'JBO ETH Limo Gateway',
    type: GatewayType.IPFS,
    url: 'https://jbo-eth.limo',
    priority: 4,
    enabled: true,
    authRequired: false,
    timeout: 5000,
    maxRetries: 3,
  },
  {
    id: 'ipfs-nftstorage-link',
    name: 'NFTStorage Gateway',
    type: GatewayType.IPFS,
    url: 'https://nftstorage.link',
    priority: 5,
    enabled: true,
    authRequired: false,
    timeout: 5000,
    maxRetries: 3,
  },
  {
    id: 'crustfiles-io',
    name: 'CrustFiles.io Gateway',
    type: GatewayType.CRUSTFILES,
    url: process.env.CRUSTFILES_BASE_URL || 'https://crustfiles.io',
    priority: 10, // 优先级较低，作为备用
    enabled: true,
    authRequired: false,
    timeout: 5000,
    maxRetries: 3,
  },
];

/**
 * 初始化网关管理器
 */
export function initializeGatewayManager(): void {
  const manager = getGatewayManager();

  // 添加默认网关
  DEFAULT_GATEWAYS.forEach(config => {
    manager.addGateway(config);
  });

  // 从缓存加载状态
  manager.loadStatesFromCache();

  // 启动健康检测
  manager.startHealthCheck();

  console.log('[Gateway] 网关管理器初始化完成');
  console.log('[Gateway] 配置的网关数量:', manager.getAllGateways().length);
  console.log('[Gateway] 启用的网关数量:', manager.getEnabledGateways().length);
}

/**
 * 获取环境变量配置的网关
 * 支持通过环境变量动态添加网关
 */
export function getEnvGateways(): GatewayConfig[] {
  const envGateways: GatewayConfig[] = [];

  // 示例：从环境变量读取自定义网关配置
  // 格式：CUSTOM_GATEWAY_ID|name|type|url|priority|authRequired|authToken
  const customGatewayEnv = process.env.CUSTOM_GATEWAYS;

  if (customGatewayEnv) {
    const gatewayConfigs = customGatewayEnv.split(';');
    gatewayConfigs.forEach((config, index) => {
      const parts = config.split('|');
      if (parts.length >= 5) {
        envGateways.push({
          id: parts[0] || `custom-${index}`,
          name: parts[1],
          type: parts[2] as GatewayType,
          url: parts[3],
          priority: parseInt(parts[4]),
          enabled: true,
          authRequired: parts[5] === 'true',
          authToken: parts[6],
        });
      }
    });
  }

  return envGateways;
}

/**
 * 导出网关配置（用于 API）
 */
export function exportGatewayConfigs(): Omit<GatewayConfig, 'authToken'>[] {
  const manager = getGatewayManager();
  return manager
    .getAllGateways()
    .map(({ authToken, ...config }) => config); // 移除敏感信息
}
