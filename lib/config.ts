/**
 * 配置文件
 * 包含应用的所有配置常量
 */

import type { Gateway } from '@/types';

/**
 * 应用信息
 */
export const APP = {
  VERSION: '3.0.0',
  BUILD_TIME: new Date().toISOString(),
  NAME: 'CrustShare',
  DESCRIPTION: '去中心化文件存储与分享平台',
} as const;

/**
 * API 端点配置
 */
export const API = {
  DB_PROXY: '/api/db_proxy',
  GET_TOKEN: '/api/get_token',
  SHARE: '/api/share',
  VERIFY_SHARE_PASSWORD: '/api/verify-share-password',
} as const;

/**
 * Crust Network 配置
 */
export const CRUST = {
  UPLOAD_API: 'https://gw.crustfiles.app/api/v0/add?pin=true',
  TEST_CID: 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
} as const;

/**
 * 公共网关源
 */
export const PUBLIC_GATEWAY_SOURCES = [
  'https://cdn.jsdelivr.net/gh/ipfs/public-gateway-checker@master/gateways.json',
  'https://raw.githubusercontent.com/ipfs/public-gateway-checker/master/gateways.json',
  'https://ipfs.github.io/public-gateway-checker/gateways.json',
] as const;

/**
 * 默认网关列表
 */
export const DEFAULT_GATEWAYS: Gateway[] = [
  { name: 'Cloudflare-CN', url: 'https://cf-ipfs.com/ipfs/', icon: '⚡', priority: 1, region: 'CN' },
  { name: 'IPFSScan-CN', url: 'https://cdn.ipfsscan.io/ipfs/', icon: '🚀', priority: 2, region: 'CN' },
  { name: '4EVERLAND-CN', url: 'https://4everland.io/ipfs/', icon: '🍀', priority: 3, region: 'CN' },
  { name: 'Lighthouse-CN', url: 'https://gateway.lighthouse.storage/ipfs/', icon: '💡', priority: 4, region: 'CN' },
  { name: 'IPFS.io-CN', url: 'https://ipfs.io/ipfs/', icon: '🧊', priority: 5, region: 'CN' },
  { name: 'DWeb Link-CN', url: 'https://dweb.link/ipfs/', icon: '🔗', priority: 6, region: 'CN' },
  { name: 'Cloudflare-IPFS', url: 'https://cloudflare-ipfs.com/ipfs/', icon: '⚡', priority: 7, region: 'CN' },
  { name: 'W3S Link-CN', url: 'https://w3s.link/ipfs/', icon: '💾', priority: 8, region: 'CN' },
  { name: 'Web3-CN', url: 'https://ipfs.web3.storage/ipfs/', icon: '🌐', priority: 9, region: 'CN' },
  { name: 'Pinata', url: 'https://gateway.pinata.cloud/ipfs/', icon: '🪅', priority: 10, region: 'INTL' },
  { name: 'NFT Storage', url: 'https://nftstorage.link/ipfs/', icon: '🖼️', priority: 11, region: 'INTL' },
  { name: 'Infura', url: 'https://ipfs.infura.io/ipfs/', icon: '🔮', priority: 12, region: 'INTL' },
  { name: 'Crust', url: 'https://crustwebsites.net/ipfs/', icon: '🔸', priority: 13, region: 'INTL' },
];

/**
 * 网关测试配置
 */
export const GATEWAY_TEST = {
  TIMEOUT: 10000,
  CONCURRENT_LIMIT: 8,
  RETRY_TIMES: 1,
  RETRY_DELAY: 1000,
  HIDE_UNAVAILABLE: false,
  CHECK_CACHE_KEY: 'cc_gateway_check_result_v3',
  CHECK_CACHE_EXPIRY: 10 * 60 * 1000,
  CACHE_VERSION: '3.0',
} as const;

/**
 * 网关健康配置
 */
export const GATEWAY_HEALTH = {
  HEALTH_CACHE_KEY: 'cc_gateway_health_v3',
  HEALTH_CACHE_EXPIRY: 30 * 24 * 60 * 60 * 1000,
  CLEANUP: {
    ENABLED: true,
    MAX_FAILURE_COUNT: 5,
    MAX_CONSECUTIVE_FAILURES: 3,
    MAX_UNUSED_DAYS: 30,
    MIN_HEALTH_SCORE: 10,
    AUTO_CLEANUP: false,
  },
  SCORING: {
    BASE_LATENCY_SCORE: 100,
    MAX_LATENCY: 10000,
    SUCCESS_BONUS: 5,
    FAILURE_PENALTY: 10,
    CN_REGION_BONUS: 15,
  },
} as const;

/**
 * 上传配置
 */
export const UPLOAD = {
  MAX_SIZE: 1024 * 1024 * 1024,
  MAX_SIZE_TEXT: '1GB',
  TIMEOUT: 30 * 60 * 1000,
  CHUNK_SIZE: 1024 * 1024,
} as const;

/**
 * 完整性检查配置
 */
export const INTEGRITY_CHECK = {
  METHOD: 'head',
  HEAD_TIMEOUT: 10000,
  FULL_TIMEOUT: 30000,
  MAX_RETRIES: 2,
  PARALLEL_GATEWAYS: 3,
  RANGE_FALLBACK: true,
  RANGE_PARALLEL: 2,
  SKIP_OVER_SIZE_BYTES: 200 * 1024 * 1024,
} as const;

/**
 * 安全配置
 */
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000,
  SESSION_DURATION: 24 * 60 * 60 * 1000,
  PASSWORD_MIN_LENGTH: 8,
} as const;

/**
 * UI 配置
 */
export const UI = {
  TOAST_DURATION: 3000,
  AUTO_RELOAD_DELAY: 1000,
  ITEMS_PER_PAGE: 10,
  LAZY_LOAD_THRESHOLD: 100,
} as const;

/**
 * 向后兼容的配置对象
 * @deprecated 请使用具体的配置对象
 */
export const CONFIG = {
  API_DB_PROXY: API.DB_PROXY,
  API_GET_TOKEN: API.GET_TOKEN,
  API_SHARE: API.SHARE,
  API_VERIFY_SHARE_PASSWORD: API.VERIFY_SHARE_PASSWORD,
  CRUST_UPLOAD_API: CRUST.UPLOAD_API,
  TEST_CID: CRUST.TEST_CID,
  PUBLIC_GATEWAY_SOURCES,
  DEFAULT_GATEWAYS,
  GATEWAY_TEST,
  GATEWAY_HEALTH,
  UPLOAD,
  INTEGRITY_CHECK,
  SECURITY,
  UI,
} as const;
