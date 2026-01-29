# 第三方网关下载功能文档

## 概述

本项目实现了基于第三方网关的文件下载功能，与 CrustFiles.io 原生下载通道完全解耦，通过智能调度多个 IPFS 网关，保障下载链路的稳定性和高可用性。

## 核心特性

### 1. 上传链路（通过正向代理）

- ✅ 通过后端正向代理上传到 CrustFiles.io
- ✅ 前端无需直接跨域请求
- ✅ 完整透传请求和响应
- ✅ 保持鉴权状态一致性
- ✅ 上传完成后自动创建下载映射

### 2. 下载链路（通过第三方网关）

- ✅ 通过第三方 IPFS 网关下载文件
- ✅ 与 CrustFiles.io 原生通道完全解耦
- ✅ 支持多个网关智能调度
- ✅ 自动故障切换
- ✅ 下载进度展示
- ✅ 错误处理和重试机制

### 3. 网关管理

- ✅ 多网关配置管理
- ✅ 网关优先级设置
- ✅ 实时健康检测
- ✅ 网关状态监控
- ✅ 智能网关选择
- ✅ 状态缓存机制

### 4. 下载映射

- ✅ 文件到网关的映射管理
- ✅ 自动选择最优网关
- ✅ 支持网关切换
- ✅ 映射过期清理
- ✅ 缓存优化

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面                              │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ 文件上传      │              │ 文件下载      │            │
│  └──────┬───────┘              └──────┬───────┘            │
└─────────┼──────────────────────────────┼────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端服务层                               │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ 正向代理 API  │              │ 下载映射 API  │            │
│  │ /api/proxy/* │              │ /api/download │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                    │
│         │              ┌───────────────┴───────────────┐    │
│         │              │  网关管理器                   │    │
│         │              │  - 网关配置                   │    │
│         │              │  - 健康检测                   │    │
│         │              │  - 智能调度                   │    │
│         │              │  - 状态监控                   │    │
│         │              └───────────────┬───────────────┘    │
│         │                              │                    │
└─────────┼──────────────────────────────┼────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│ CrustFiles.io    │          │  IPFS 网关池      │
│   上传服务器      │          │  - ipfs.io       │
│                  │          │  - dweb.link     │
│                  │          │  - cloudflare... │
│                  │          │  - ...           │
└──────────────────┘          └──────────────────┘
```

## 技术实现

### 网关类型

**文件**: `src/lib/gateway/types.ts`

```typescript
export enum GatewayStatus {
  AVAILABLE = 'available',      // 可用
  UNAVAILABLE = 'unavailable',  // 不可用
  DEGRADED = 'degraded',        // 降级（响应慢）
  MAINTENANCE = 'maintenance',  // 维护中
}

export enum GatewayType {
  IPFS = 'ipfs',                // IPFS 网关
  CRUSTFILES = 'crustfiles',    // CrustFiles 网关
  CUSTOM = 'custom',            // 自定义网关
}
```

### 网关管理器

**文件**: `src/lib/gateway/manager.ts`

**核心功能**:

1. **网关配置管理**
   ```typescript
   const manager = getGatewayManager();
   manager.addGateway(config);
   manager.updateGateway(id, updates);
   manager.removeGateway(id);
   ```

2. **智能网关选择**
   ```typescript
   const gateway = manager.selectBestGateway({
     excludeIds: ['unavailable-gateway'],
     requireAuth: false,
     maxResponseTime: 3000,
     minSuccessRate: 0.8,
   });
   ```

3. **健康检测**
   ```typescript
   // 自动启动健康检测
   manager.startHealthCheck();  // 默认 20 秒检测一次
   
   // 停止检测
   manager.stopHealthCheck();
   ```

4. **状态监控**
   ```typescript
   const stats = manager.getStatistics();
   // 返回:
   // - total: 总网关数
   // - available: 可用网关数
   // - averageResponseTime: 平均响应时间
   // - averageSuccessRate: 平均成功率
   ```

### 网关配置

**文件**: `src/lib/gateway/config.ts`

**默认网关列表**:

| 网关名称 | URL | 优先级 | 类型 |
|---------|-----|--------|------|
| IPFS.io Gateway | https://ipfs.io | 1 | IPFS |
| dweb.link Gateway | https://dweb.link | 2 | IPFS |
| Cloudflare IPFS Gateway | https://cloudflare-ipfs.com | 3 | IPFS |
| JBO ETH Limo Gateway | https://jbo-eth.limo | 4 | IPFS |
| NFTStorage Gateway | https://nftstorage.link | 5 | IPFS |
| CrustFiles.io Gateway | https://crustfiles.io | 10 | CrustFiles |

### 下载映射管理

**文件**: `src/lib/gateway/mapper.ts`

**核心功能**:

1. **创建下载映射**
   ```typescript
   const mapper = getGatewayMapper();
   const mapping = mapper.createMapping(fileId, cid, gatewayId);
   // 返回:
   // - fileId: 文件 ID
   // - cid: IPFS CID
   // - gatewayId: 选定的网关 ID
   // - downloadUrl: 下载 URL
   // - expiresAt: 过期时间（24 小时）
   ```

2. **更新映射（切换网关）**
   ```typescript
   const mapping = mapper.updateMapping(fileId, newGatewayId);
   // 自动选择新的网关并更新下载 URL
   ```

3. **获取映射**
   ```typescript
   const mapping = mapper.getMapping(fileId);
   const mapping = mapper.getMappingByCID(cid);
   ```

### 下载 API

**文件**: `src/app/api/download/route.ts`

#### GET 请求 - 获取下载 URL

```http
GET /api/download?fileId={fileId}&cid={cid}
```

**响应**:
```json
{
  "success": true,
  "downloadUrl": "https://ipfs.io/ipfs/Qm...",
  "gatewayId": "ipfs-io",
  "expiresAt": "2024-01-30T00:00:00.000Z"
}
```

#### POST 请求 - 切换网关

```http
POST /api/download
Content-Type: application/json

{
  "fileId": "file-xxx",
  "cid": "Qm...",
  "gatewayId": "dweb-link"
}
```

**响应**:
```json
{
  "success": true,
  "downloadUrl": "https://dweb.link/ipfs/Qm...",
  "gatewayId": "dweb-link",
  "message": "已切换到备用网关"
}
```

#### DELETE 请求 - 清理映射

```http
DELETE /api/download?fileId={fileId}
```

**响应**:
```json
{
  "success": true,
  "message": "下载映射已清理"
}
```

### 网关状态 API

**文件**: `src/app/api/gateway/status/route.ts`

#### 获取网关状态

```http
GET /api/gateway/status
```

**响应**:
```json
{
  "success": true,
  "statistics": {
    "total": 6,
    "enabled": 6,
    "available": 5,
    "unavailable": 0,
    "degraded": 1,
    "maintenance": 0,
    "averageResponseTime": 234,
    "averageSuccessRate": 98.5
  },
  "gateways": [
    {
      "id": "ipfs-io",
      "name": "IPFS.io Gateway",
      "url": "https://ipfs.io",
      "priority": 1,
      "enabled": true,
      "state": {
        "status": "available",
        "responseTime": 120,
        "successRate": 100,
        "lastCheckTime": "2024-01-29T12:00:00.000Z"
      }
    }
  ],
  "timestamp": "2024-01-29T12:00:00.000Z"
}
```

## 使用示例

### 前端组件集成

#### FileUpload 组件（上传）

```typescript
import { getProxy } from '@/lib/proxy';

const proxy = getProxy();

// 上传文件
const result = await proxy.upload(file, {
  onProgress: (progress) => {
    console.log(`${progress.percentage}%`);
  }
});

// 上传成功后自动创建下载映射
if (result.success) {
  const mappingResponse = await fetch(`/api/download?fileId=${fileId}&cid=${result.cid}`);
  const mapping = await mappingResponse.json();
  console.log('下载映射已创建:', mapping.gatewayId);
}
```

#### DownloadDialog 组件（下载）

```typescript
const handleDownload = async () => {
  // 获取下载 URL（通过网关）
  const response = await fetch(`/api/download?fileId=${fileId}&cid=${cid}`);
  const data = await response.json();
  
  // 触发浏览器下载
  const link = document.createElement('a');
  link.href = data.downloadUrl;
  link.download = fileName;
  link.click();
};

const handleRetry = async () => {
  // 切换到备用网关
  const response = await fetch('/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, cid, fileName }),
  });
  const data = await response.json();
  
  // 使用新的下载 URL
  const link = document.createElement('a');
  link.href = data.downloadUrl;
  link.download = fileName;
  link.click();
};
```

## 配置管理

### 环境变量

```env
# CrustFiles.io 配置
CRUSTFILES_BASE_URL=https://crustfiles.io
CRUSTFILES_ACCESS_TOKEN=your_access_token

# 自定义网关配置（可选）
# 格式：id|name|type|url|priority|authRequired|authToken;...
CUSTOM_GATEWAYS=custom-1|My Gateway|ipfs|https://mygateway.com|1|false|auth1;custom-2|Auth Gateway|ipfs|https://authgateway.com|2|true|auth2
```

### 自定义网关

```typescript
import { getGatewayManager, GatewayType } from '@/lib/gateway';

const manager = getGatewayManager();

// 添加自定义网关
manager.addGateway({
  id: 'my-gateway',
  name: 'My Custom Gateway',
  type: GatewayType.IPFS,
  url: 'https://mygateway.com',
  priority: 10,
  enabled: true,
  authRequired: true,
  authToken: 'my-auth-token',
  timeout: 5000,
  maxRetries: 3,
});
```

## 健康检测机制

### 检测频率

- 默认：每 20 秒检测一次
- 可通过初始化参数自定义

### 检测方式

- HTTP HEAD 请求
- 检测官方测试文件：`QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67uvA3Nn`
- 超时时间：5 秒（可配置）

### 状态判定

| 响应状态 | 网关状态 |
|---------|---------|
| 200 OK, 响应时间 ≤ 3s | AVAILABLE |
| 200 OK, 响应时间 > 3s | DEGRADED |
| 5xx 错误 | UNAVAILABLE |
| 503 Service Unavailable | MAINTENANCE |
| 404 Not Found | AVAILABLE（测试文件不存在） |

### 智能调度逻辑

1. **筛选可用网关**
   - 排除禁用的网关
   - 排除不可用的网关
   - 应用筛选条件（超时、成功率等）

2. **按优先级排序**
   - 优先级数字越小越优先
   - 相同优先级比较成功率
   - 成功率相近比较响应时间

3. **故障切换**
   - 当前网关不可用时，自动切换到下一优先级
   - 用户可手动触发切换
   - 支持排除特定网关

## 状态缓存

### 缓存策略

| 缓存类型 | TTL | 说明 |
|---------|-----|------|
| 网关状态 | 10 分钟 | 定时刷新 |
| 下载映射 | 24 小时 | 按需刷新 |
| 健康检测结果 | 1 分钟 | 实时更新 |

### 缓存机制

- 网关状态在定时检测后自动缓存
- 下载映射创建后立即缓存
- 应用启动时从缓存加载状态
- 支持手动清理过期数据

## 日志记录

**文件**: `src/lib/logger.ts`

### 日志类型

```typescript
export enum LogType {
  UPLOAD = 'upload',       // 上传相关
  DOWNLOAD = 'download',   // 下载相关
  GATEWAY = 'gateway',     // 网关相关
  PROXY = 'proxy',         // 代理相关
  SYSTEM = 'system',       // 系统相关
}
```

### 日志级别

```typescript
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
```

### 使用示例

```typescript
import logger from '@/lib/logger';

// 上传日志
logger.uploadStart(fileId, fileName, fileSize);
logger.uploadProgress(fileId, fileName, 50);
logger.uploadSuccess(fileId, fileName, cid, 2340);
logger.uploadError(fileId, fileName, '网络错误');

// 下载日志
logger.downloadStart(fileId, fileName, 'ipfs-io');
logger.downloadSuccess(fileId, fileName, 'ipfs-io', 1200);
logger.downloadError(fileId, fileName, 'ipfs-io', '网关超时');
logger.downloadRetry(fileId, fileName, 'ipfs-io', 'dweb-link');

// 网关日志
logger.gatewayCheckStart('ipfs-io');
logger.gatewayCheckSuccess('ipfs-io', 120);
logger.gatewayCheckFailed('ipfs-io', '超时');
logger.gatewayStatusChange('ipfs-io', 'available', 'unavailable');
logger.gatewaySelected('ipfs-io', fileId);
logger.gatewayUnavailable('ipfs-io', '网络错误');
```

### 日志查询

```typescript
// 获取所有日志
const logs = logger.getLogs();

// 按类型筛选
const uploadLogs = logger.getLogsByType(LogType.UPLOAD);
const gatewayLogs = logger.getLogsByType(LogType.GATEWAY);

// 按级别筛选
const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);

// 按文件 ID 筛选
const fileLogs = logger.getLogsByFileId(fileId);

// 按网关 ID 筛选
const gatewayLogs = logger.getLogsByGatewayId('ipfs-io');

// 获取最近日志
const recentLogs = logger.getRecentLogs(50);

// 导出日志
const logString = logger.exportLogs();

// 获取统计信息
const stats = logger.getStatistics();
```

## 安全性

### 1. 网关认证

```typescript
// 支持需要认证的网关
{
  authRequired: true,
  authToken: 'your-auth-token',
}
```

### 2. 访问令牌

- 下载 URL 包含访问令牌（如果需要）
- 令牌与映射关联，24 小时后过期
- 支持令牌刷新

### 3. 数据隔离

- 不同用户的映射相互独立
- 网关状态全局共享
- 日志包含用户和文件标识

## 性能优化

### 1. 网关检测

- 异步非阻塞执行
- 独立于主业务流程
- 并发检测多个网关
- 避免频繁探测

### 2. 状态缓存

- 减少实时检测频次
- 提升网关选择效率
- 自动过期清理
- 持久化到 localStorage

### 3. 映射管理

- 自动清理过期映射
- 缓存减少重复计算
- 批量加载优化

## 故障排查

### 1. 所有网关不可用

**症状**: 下载时返回 "下载服务暂不可用"

**解决方案**:
- 检查网络连接
- 查看网关状态 API
- 查看控制台日志
- 添加自定义网关

### 2. 下载失败

**症状**: 点击下载后无响应或报错

**解决方案**:
- 检查 CID 是否正确
- 尝试切换网关
- 查看浏览器控制台
- 检查网关日志

### 3. 网关状态异常

**症状**: 网关显示为 "不可用"

**解决方案**:
- 检查网关 URL 是否正确
- 查看网关健康日志
- 检查网络连接
- 禁用问题网关

### 4. 映射过期

**症状**: 下载链接失效

**解决方案**:
- 重新获取下载 URL
- 系统会自动创建新映射
- 检查缓存清理逻辑

## 监控和统计

### 网关统计

```typescript
const stats = manager.getStatistics();
// 返回:
// - total: 总网关数
// - enabled: 启用的网关数
// - available: 可用网关数
// - averageResponseTime: 平均响应时间
// - averageSuccessRate: 平均成功率
```

### 日志统计

```typescript
const stats = logger.getStatistics();
// 返回:
// - total: 总日志数
// - byLevel: 按级别统计
// - byType: 按类型统计
```

## 相关文档

- [代理功能文档](./PROXY.md)
- [API 文档](./API.md)
- [CrustFiles API 文档](./CRUSTFILES_API.md)
- [集成指南](./CRUSTFILES_SETUP.md)
- [项目 README](./README.md)

## 更新日志

### v3.0.0 (2025-01-XX)
- ✨ 新增第三方网关下载功能
- ✨ 实现网关智能调度
- ✨ 实现网关健康检测
- ✨ 实现下载映射管理
- ✨ 实现状态缓存机制
- ✨ 实现日志记录系统
- ✨ 实现故障自动切换
- 📝 完善文档

### v2.0.0 (2025-01-XX)
- ✨ 新增 CrustFiles.io 正向代理功能

### v1.0.0 (2025-01-XX)
- ✨ 初始版本
