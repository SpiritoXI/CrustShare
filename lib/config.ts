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
  // 多个上传 API 端点，支持故障转移
  UPLOAD_APIS: [
    'https://gw.crustfiles.app/api/v0/add?pin=true',
    'https://gw.crust.network/api/v0/add?pin=true',
    'https://gw.ipfsscan.io/api/v0/add?pin=true',
  ],
  // 主上传 API（向后兼容）
  UPLOAD_API: 'https://gw.crustfiles.app/api/v0/add?pin=true',
  // 上传超时时间（毫秒）- 5分钟
  UPLOAD_TIMEOUT: 5 * 60 * 1000,
  // 上传重试次数
  UPLOAD_RETRY_ATTEMPTS: 3,
  // 重试延迟基数（毫秒）
  UPLOAD_RETRY_DELAY: 2000,
} as const;

/**
 * 网关测试 CID 列表 - 多个备用
 */
export const GATEWAY_TEST_CIDS = [
  'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',
  'QmYwAPJzv5CZsnAzt8auVKKf7u8fKjs3aLrH2z8zZzZzZz',
  'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
] as const;

/**
 * 下载连通性测试 CID - 约 100KB 的文件
 * 用于下载页面网关智能检测，验证实际下载能力
 * IPFS 官方 CID，全球可用且稳定
 */
export const GATEWAY_DOWNLOAD_TEST_CID = 'QmZtmD2qt6fJot32nabSP3CUjicnypEBz7bHVDhPQt9aY' as const;

/**
 * 下载连通性测试配置
 */
export const GATEWAY_DOWNLOAD_TEST = {
  // 测试文件大小（字节）- 约 100KB
  TEST_FILE_SIZE: 100 * 1024,
  // 下载测试超时时间（毫秒）
  TIMEOUT: 30000,
  // 最小下载字节数（用于判断连通性）
  MIN_DOWNLOAD_BYTES: 50 * 1024,
  // 最大重试次数
  MAX_RETRIES: 2,
  // 重试延迟（毫秒）
  RETRY_DELAY: 1000,
} as const;

/**
 * 传播配置
 */
export const PROPAGATION = {
  // 最大并发传播数
  MAX_CONCURRENT: 5,
  // 传播超时时间（毫秒）
  TIMEOUT: 30000,
  // 最大传播网关数
  MAX_GATEWAYS: 15,
  // 重试次数
  MAX_RETRIES: 3,
  // 重试延迟基数（毫秒）
  RETRY_DELAY: 1000,
} as const;

/**
 * 公共网关源 - 多个平台路径
 */
export const PUBLIC_GATEWAY_SOURCES = [
  // GitHub/CDN 源
  'https://cdn.jsdelivr.net/gh/ipfs/public-gateway-checker@master/gateways.json',
  'https://raw.githubusercontent.com/ipfs/public-gateway-checker/master/gateways.json',
  'https://ipfs.github.io/public-gateway-checker/gateways.json',
  // IPFS 官方源
  'https://ipfs.io/ipfs/QmYwAPJzv5CZsnAzt8auVKKf7u8fKjs3aLrH2z8zZzZzZz/gateways.json',
  // 社区维护源
  'https://cdn.ipfsscan.io/api/gateways.json',
  'https://4everland.io/api/gateways.json',
  'https://gateway.lighthouse.storage/api/gateways.json',
] as const;

/**
 * 获取网关时的快速测试配置
 */
export const GATEWAY_FETCH_TEST = {
  TIMEOUT: 5000,        // 快速测试超时时间（毫秒）
  MAX_CONCURRENT: 10,   // 最大并发测试数
  MAX_GATEWAYS: 30,     // 最多保留的网关数量
} as const;

/**
 * 默认网关列表 - 精选15个常用网关
 * 这些网关经过筛选，在国内访问速度较快
 */
export const DEFAULT_GATEWAYS: Gateway[] = [
  // 国内友好网关 - 优先检测 (15个)
  { name: 'Cloudflare', url: 'https://cf-ipfs.com/ipfs/', icon: '⚡', priority: 1, region: 'CN' },
  { name: 'IPFSScan', url: 'https://cdn.ipfsscan.io/ipfs/', icon: '🚀', priority: 2, region: 'CN' },
  { name: '4EVERLAND', url: 'https://4everland.io/ipfs/', icon: '🍀', priority: 3, region: 'CN' },
  { name: 'Lighthouse', url: 'https://gateway.lighthouse.storage/ipfs/', icon: '💡', priority: 4, region: 'CN' },
  { name: 'IPFS.io', url: 'https://ipfs.io/ipfs/', icon: '🧊', priority: 5, region: 'CN' },
  { name: 'DWeb Link', url: 'https://dweb.link/ipfs/', icon: '🔗', priority: 6, region: 'CN' },
  { name: 'Cloudflare-IPFS', url: 'https://cloudflare-ipfs.com/ipfs/', icon: '☁️', priority: 7, region: 'CN' },
  { name: 'W3S Link', url: 'https://w3s.link/ipfs/', icon: '💾', priority: 8, region: 'CN' },
  { name: 'Web3 Storage', url: 'https://ipfs.web3.storage/ipfs/', icon: '🌐', priority: 9, region: 'CN' },
  { name: 'NFT Storage', url: 'https://nftstorage.link/ipfs/', icon: '🖼️', priority: 10, region: 'CN' },
  { name: 'Pinata', url: 'https://gateway.pinata.cloud/ipfs/', icon: '🪅', priority: 11, region: 'CN' },
  { name: 'Flk-IPFS', url: 'https://flk-ipfs.xyz/ipfs/', icon: '🔥', priority: 12, region: 'CN' },
  { name: 'IPFS Cross', url: 'https://ipfs.crossbell.io/ipfs/', icon: '✝️', priority: 13, region: 'CN' },
  { name: 'Conflux', url: 'https://ipfs.confluxnetwork.org/ipfs/', icon: '🔷', priority: 14, region: 'CN' },
  { name: 'Crust-IPFS', url: 'https://ipfs.crust.network/ipfs/', icon: '🦀', priority: 15, region: 'CN' },
];

/**
 * 扩展网关列表 - 作为备用网关
 * 用户可以在网关管理页面自行检测和启用
 */
export const EXTENDED_GATEWAYS: Gateway[] = [
  // 亚洲区域
  { name: 'C4', url: 'https://c4rex.co/ipfs/', icon: '🎯', priority: 16, region: 'CN' },
  { name: 'IPFS ETH', url: 'https://ipfs.eth.aragon.network/ipfs/', icon: '⬡', priority: 17, region: 'CN' },
  { name: 'Hardbin', url: 'https://hardbin.com/ipfs/', icon: '📦', priority: 18, region: 'CN' },
  { name: 'Fleek', url: 'https://ipfs.fleek.co/ipfs/', icon: '⚙️', priority: 19, region: 'CN' },
  { name: 'Sola', url: 'https://ipfs.sola.day/ipfs/', icon: '☀️', priority: 20, region: 'CN' },
  { name: 'JPU', url: 'https://ipfs.jpu.jp/ipfs/', icon: '🇯🇵', priority: 21, region: 'CN' },

  // 国际区域
  { name: 'Infura', url: 'https://ipfs.infura.io/ipfs/', icon: '🔮', priority: 22, region: 'INTL' },
  { name: 'Crust', url: 'https://crustwebsites.net/ipfs/', icon: '🔸', priority: 23, region: 'INTL' },
  { name: 'Filebase', url: 'https://ipfs.filebase.io/ipfs/', icon: '📁', priority: 24, region: 'INTL' },
  { name: 'Alchemy', url: 'https://ipfs.alchemy.com/ipfs/', icon: '✨', priority: 25, region: 'INTL' },
  { name: 'QuickNode', url: 'https://ipfs.quicknode.com/ipfs/', icon: '⚡', priority: 26, region: 'INTL' },
  { name: 'Ankr', url: 'https://ipfs.ankr.com/ipfs/', icon: '🔗', priority: 27, region: 'INTL' },
  { name: 'Kleros', url: 'https://ipfs.kleros.io/ipfs/', icon: '⚖️', priority: 28, region: 'INTL' },
  { name: 'Snapshot', url: 'https://snapshot.mypinata.cloud/ipfs/', icon: '📸', priority: 29, region: 'INTL' },
  { name: 'Fleek-INTL', url: 'https://storage.fleek.co/ipfs/', icon: '☁️', priority: 30, region: 'INTL' },
  { name: 'Textile', url: 'https://hub.textile.io/ipfs/', icon: '🧵', priority: 31, region: 'INTL' },
  { name: 'Temporal', url: 'https://temporal.cloud/ipfs/', icon: '⏰', priority: 32, region: 'INTL' },
  { name: 'Eternum', url: 'https://ipfs.eternum.io/ipfs/', icon: '♾️', priority: 33, region: 'INTL' },
  { name: 'Seren', url: 'https://ipfs.seren.net/ipfs/', icon: '🌙', priority: 34, region: 'INTL' },
  { name: 'Permaweb', url: 'https://ipfs.permaweb.io/ipfs/', icon: '🕸️', priority: 35, region: 'INTL' },
  { name: 'Peergos', url: 'https://ipfs.peergos.me/ipfs/', icon: '🔒', priority: 36, region: 'INTL' },
  { name: 'NftStorage-INTL', url: 'https://nftstorage.link/ipfs/', icon: '🎨', priority: 37, region: 'INTL' },
  { name: 'Chainsafe', url: 'https://ipfs.chainsafe.io/ipfs/', icon: '⛓️', priority: 38, region: 'INTL' },
  { name: 'Estuary', url: 'https://api.estuary.tech/gw/ipfs/', icon: '🌊', priority: 39, region: 'INTL' },
  { name: 'DWorld', url: 'https://ipfs.dweb.link/ipfs/', icon: '🌍', priority: 40, region: 'INTL' },
];

/**
 * 网关测试配置
 */
export const GATEWAY_TEST = {
  TIMEOUT: 15000, // 增加到15秒，适应较差网络环境
  CONCURRENT_LIMIT: 8,
  RETRY_TIMES: 1,
  RETRY_DELAY: 1000,
  HIDE_UNAVAILABLE: false,
  CHECK_CACHE_KEY: 'cc_gateway_check_result_v3',
  CHECK_CACHE_EXPIRY: 3 * 60 * 1000, // 减少到3分钟，网关状态变化较快
  CACHE_VERSION: '3.2', // 更新缓存版本使旧缓存失效
  // 上传前验证网关 freshness
  GATEWAY_FRESHNESS_THRESHOLD: 60 * 1000, // 1分钟内检测过的网关才视为新鲜
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
  HEAD_TIMEOUT: 15000, // 增加到15秒
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
 * 网关保存配置
 * 用于长期保存连通性较好的网关
 */
export const GATEWAY_SAVE = {
  // localStorage 存储键
  STORAGE_KEY: 'cc_saved_gateways_v1',
  // 保存网关的最小健康度分数 (0-100)
  MIN_HEALTH_SCORE: 70,
  // 保存网关的最小可靠性百分比 (0-100)
  MIN_RELIABILITY: 80,
  // 最大保存网关数量
  MAX_SAVED_GATEWAYS: 10,
  // 保存网关的最大延迟（毫秒）
  MAX_LATENCY: 3000,
  // 成功率阈值（百分比）
  MIN_SUCCESS_RATE: 75,
  // 保存网关的有效期（毫秒）- 30天
  EXPIRY: 30 * 24 * 60 * 60 * 1000,
  // 优先检测保存的网关
  PRIORITY_SAVED_GATEWAYS: true,
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
  CRUST_UPLOAD_APIS: CRUST.UPLOAD_APIS,
  CRUST_UPLOAD_TIMEOUT: CRUST.UPLOAD_TIMEOUT,
  CRUST_UPLOAD_RETRY_ATTEMPTS: CRUST.UPLOAD_RETRY_ATTEMPTS,
  CRUST_UPLOAD_RETRY_DELAY: CRUST.UPLOAD_RETRY_DELAY,
  TEST_CID: GATEWAY_TEST_CIDS[0],
  GATEWAY_TEST_CIDS,
  PUBLIC_GATEWAY_SOURCES,
  DEFAULT_GATEWAYS,
  EXTENDED_GATEWAYS,
  GATEWAY_FETCH_TEST,
  GATEWAY_TEST,
  GATEWAY_HEALTH,
  GATEWAY_SAVE,
  UPLOAD,
  INTEGRITY_CHECK,
  SECURITY,
  UI,
  PROPAGATION,
} as const;
