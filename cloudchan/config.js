/**
 * CloudChan 配置文件
 * @version 2.2.1
 */

const APP = {
    VERSION: '2.2.1',
    BUILD_TIME: '2026-01-22'
};

console.log(`CloudChan Config 已加载 - 版本: ${APP.VERSION}`);

export const CONFIG = {
    APP: { ...APP },

    // 后端 API 配置
    API_DB_PROXY: '/api/db_proxy',
    API_GET_TOKEN: '/api/get_token',

    // Crust 官方直连上传接口
    CRUST_UPLOAD_API: 'https://gw.crustfiles.app/api/v0/add?pin=true',

    // 用于网关测速的测试文件 CID（小文件，约1KB的文本文件）
    TEST_CID: 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy',

    // IPFS 公共网关配置
    PUBLIC_GATEWAY_SOURCES: [
        'https://cdn.jsdelivr.net/gh/ipfs/public-gateway-checker@master/gateways.json',
        'https://raw.githubusercontent.com/ipfs/public-gateway-checker/master/gateways.json',
        'https://cdn.statically.io/gh/ipfs/public-gateway-checker/master/gateways.json',
        'https://ipfs.github.io/public-gateway-checker/gateways.json',
        'https://gcore.jsdelivr.net/gh/ipfs/public-gateway-checker@master/gateways.json',
        'https://fastly.jsdelivr.net/gh/ipfs/public-gateway-checker@master/gateways.json',
        'https://raw.githubusercontent.com/ipfs/ipfs-gateway/master/gateways.json',
        'https://cdn.jsdelivr.net/gh/ipfs/ipfs-gateway@main/gateways.json',
        'https://raw.githubusercontent.com/ipfs/public-gateway-list/master/gateways.json',
    ],

    // 默认精选网关列表
    DEFAULT_GATEWAYS: [
        // === 国内友好网关（优先推荐）===
        { name: 'Cloudflare-CN',  url: 'https://cf-ipfs.com/ipfs/',         icon: '⚡', priority: 1, region: 'CN' },
        { name: 'IPFSScan-CN',    url: 'https://cdn.ipfsscan.io/ipfs/',     icon: '🚀', priority: 2, region: 'CN' },
        { name: '4EVERLAND-CN',   url: 'https://4everland.io/ipfs/',        icon: '🍀', priority: 3, region: 'CN' },
        { name: 'Lighthouse-CN',  url: 'https://gateway.lighthouse.storage/ipfs/', icon: '💡', priority: 4, region: 'CN' },
        { name: 'IPFS.io-CN',     url: 'https://ipfs.io/ipfs/',             icon: '🧊', priority: 5, region: 'CN' },
        { name: 'DWeb Link-CN',   url: 'https://dweb.link/ipfs/',           icon: '🔗', priority: 6, region: 'CN' },
        { name: 'Cloudflare-IPFS',url: 'https://cloudflare-ipfs.com/ipfs/', icon: '⚡', priority: 7, region: 'CN' },
        { name: 'W3S Link-CN',    url: 'https://w3s.link/ipfs/',            icon: '💾', priority: 8, region: 'CN' },
        { name: 'Web3-CN',        url: 'https://ipfs.web3.storage/ipfs/',   icon: '🌐', priority: 9, region: 'CN' },

        // === 主流国际网关（稳定可靠）===
        { name: 'Pinata',         url: 'https://gateway.pinata.cloud/ipfs/',icon: '🪅', priority: 10, region: 'INTL' },
        { name: 'NFT Storage',    url: 'https://nftstorage.link/ipfs/',     icon: '🖼️', priority: 11, region: 'INTL' },
        { name: 'Infura',         url: 'https://ipfs.infura.io/ipfs/',      icon: '🔮', priority: 12, region: 'INTL' },
        { name: 'Crust',          url: 'https://crustwebsites.net/ipfs/',   icon: '🔸', priority: 13, region: 'INTL' },
        { name: 'Jorropo',        url: 'https://ipfs.jorropo.com/ipfs/',    icon: '🌍', priority: 14, region: 'INTL' },
        { name: 'Trust IPFS',     url: 'https://trustipfs.io/ipfs/',        icon: '🛡️', priority: 15, region: 'INTL' },
        { name: 'Via IPFS',       url: 'https://via.ipfs.io/ipfs/',         icon: '🎯', priority: 16, region: 'INTL' },
        { name: 'Fleek',          url: 'https://ipfs.fleek.co/ipfs/',       icon: '⚛️', priority: 17, region: 'INTL' },
        { name: 'Web3.Storage',   url: 'https://web3.storage/ipfs/',        icon: '🌐', priority: 18, region: 'INTL' },
        { name: 'Akasha',         url: 'https://ipfs.akasha.link/ipfs/',     icon: '💫', priority: 19, region: 'INTL' },

        // === 第三方与社区网关 ===
        { name: 'CID Contact',    url: 'https://cid.contact/ipfs/',         icon: '📞', priority: 20, region: 'INTL' },
        { name: 'Dweb.Link',      url: 'https://dweb.link/ipfs/',           icon: '🔗', priority: 21, region: 'INTL' },
        { name: 'IPFS.Gateway',   url: 'https://ipfs.gateway.link/ipfs/',    icon: '🚪', priority: 22, region: 'INTL' },
        { name: 'Fleek.co',       url: 'https://ipfs.fleek.co/ipfs/',       icon: '⚛️', priority: 23, region: 'INTL' },
        { name: 'IPFS.Eth',       url: 'https://ipfs.eth/ipfs/',            icon: '🐮', priority: 24, region: 'INTL' },
        { name: 'Storj',          url: 'https://ipfs.storj.io/ipfs/',       icon: '🗂️', priority: 25, region: 'INTL' },
        { name: 'Filebase',       url: 'https://ipfs.filebase.io/ipfs/',    icon: '📦', priority: 26, region: 'INTL' },
        { name: 'DStorage',       url: 'https://ipfs.dst13.com/ipfs/',      icon: '💽', priority: 27, region: 'INTL' },
        { name: 'NFT.Storage',    url: 'https://nftstorage.link/ipfs/',     icon: '🖼️', priority: 28, region: 'INTL' },

        // === 大学与研究机构网关 ===
        { name: 'MIT-IPFS',       url: 'https://ipfs.mit.edu/ipfs/',        icon: '🎓', priority: 30, region: 'INTL' },
        { name: 'Berkeley-IPFS',  url: 'https://ipfs.berkeley.edu/ipfs/',   icon: '🎓', priority: 31, region: 'INTL' },

        // === 实验性与开发者网关 ===
        { name: 'IPFS-Sync',      url: 'https://ipfs-sync.com/ipfs/',       icon: '🔄', priority: 35, region: 'INTL' },
        { name: 'IPFS-Tech',      url: 'https://tech.ipfs.io/ipfs/',        icon: '⚙️', priority: 36, region: 'INTL' },
        { name: 'Brave-IPFS',     url: 'https://ipfs.brave.io/ipfs/',       icon: '🦁', priority: 37, region: 'INTL' },
        { name: 'Opera-IPFS',     url: 'https://ipfs.opera.io/ipfs/',       icon: '🎭', priority: 38, region: 'INTL' },

        // === 国内第三方网关 ===
        { name: 'IPFS-CN',        url: 'https://ipfs.cn/ipfs/',             icon: '🇨🇳', priority: 40, region: 'CN' },
        { name: 'IPFS-CN-IO',     url: 'https://ipfs-cn.io/ipfs/',          icon: '🇨🇳', priority: 41, region: 'CN' },
        { name: 'IPFS-Plus',      url: 'https://ipfs.plus/ipfs/',           icon: '➕', priority: 42, region: 'CN' },
        { name: 'IPFS-X',         url: 'https://ipfs.x/ipfs/',              icon: '❌', priority: 43, region: 'CN' },
        { name: 'IPFS-Pro',       url: 'https://ipfs.pro/ipfs/',            icon: '👍', priority: 44, region: 'CN' },
        { name: 'IPFS-Cloud',     url: 'https://ipfs.cloud/ipfs/',          icon: '☁️', priority: 45, region: 'CN' },
        { name: 'IPFS-Hub',       url: 'https://ipfs.hub/ipfs/',            icon: '🔷', priority: 46, region: 'CN' },
        { name: 'IPFS-Network',   url: 'https://ipfs.network/ipfs/',        icon: '🌐', priority: 47, region: 'CN' },

        // === 备用与回退网关 ===
        { name: 'Gateway-1',      url: 'https://gateway.1.me/ipfs/',        icon: '1️⃣', priority: 50, region: 'INTL' },
        { name: 'Gateway-2',      url: 'https://gateway.2.no-ipfs.org/ipfs/', icon: '2️⃣', priority: 51, region: 'INTL' },
        { name: 'IPFS-Backup',    url: 'https://ipfs.backup.xyz/ipfs/',     icon: '💾', priority: 52, region: 'INTL' },
        { name: 'IPFS-Reserve',   url: 'https://ipfs.reserve.io/ipfs/',     icon: '🔒', priority: 53, region: 'INTL' },
    ],

    // 网关测试配置
    GATEWAY_TEST: {
        TIMEOUT: 10000,     // 超时时间（毫秒）
        CONCURRENT_LIMIT: 8, // 并发测速数量
        RETRY_TIMES: 1,      // 失败重试次数
        RETRY_DELAY: 1000,  // 重试延迟（毫秒）
        HIDE_UNAVAILABLE: false, // 是否隐藏不可用网关

        // 检测结果短期缓存
        CHECK_CACHE_KEY: 'cc_gateway_check_result_v1',
        CHECK_CACHE_EXPIRY: 10 * 60 * 1000, // 10分钟缓存 - 短时间内避免重复检测
        CACHE_VERSION: '2.0' // 缓存版本，用于版本控制
    },

    // 网关健康追踪配置
    GATEWAY_HEALTH: {
        HEALTH_CACHE_KEY: 'cc_gateway_health_v2',  // 健康状态缓存键（升级版本）
        HEALTH_CACHE_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30天过期

        // 网关清理规则
        CLEANUP: {
            ENABLED: true,           // 是否启用自动清理
            MAX_FAILURE_COUNT: 5,    // 最大失败次数（超过此值标记为待清理）
            MAX_CONSECUTIVE_FAILURES: 3,  // 最大连续失败次数（超过此值标记为待清理）
            MAX_UNUSED_DAYS: 30,     // 网关未使用天数（超过此天数未成功访问标记为待清理）
            MIN_HEALTH_SCORE: 10,    // 最低健康分数（低于此分数标记为待清理）
            AUTO_CLEANUP: false,     // 是否自动清理（false=仅标记，true=自动删除）
        },

        // 网关质量评分规则
        SCORING: {
            BASE_LATENCY_SCORE: 100,  // 基础延迟分数
            MAX_LATENCY: 10000,       // 最大延迟（毫秒）
            SUCCESS_BONUS: 5,         // 每次成功加分
            FAILURE_PENALTY: 10,      // 每次失败扣分
            CN_REGION_BONUS: 15,      // CN 地区加分
        }
    },

    // 文件上传配置
    UPLOAD: {
        MAX_SIZE: 1024 * 1024 * 1024,  // 最大文件大小：1GB
        MAX_SIZE_TEXT: '1GB',
        TIMEOUT: 30 * 60 * 1000           // 上传超时：30分钟
    },

    // 文件完整性验证配置
    INTEGRITY_CHECK: {
        METHOD: 'head',
        HEAD_TIMEOUT: 10000,  // HEAD 请求超时
        FULL_TIMEOUT: 30000,  // 完整下载超时
        MAX_RETRIES: 2,  // 最大重试次数
        PARALLEL_GATEWAYS: 3,
        RANGE_FALLBACK: true,
        RANGE_PARALLEL: 2,
        SKIP_OVER_SIZE_BYTES: 200 * 1024 * 1024,
    },

    // UI 配置
    UI: {
        TOAST_DURATION: 3000,  // Toast 提示显示时长（毫秒）
        AUTO_RELOAD_DELAY: 1000  // 操作完成后的自动刷新延迟
    }
};
