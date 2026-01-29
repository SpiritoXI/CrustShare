# API 文档

本文档详细描述 CrustShare 的所有 API 接口。

---

## 目录

- [认证 API](#认证-api)
- [代理 API (CrustFiles.io 正向代理)](#代理-api-crustfilesio-正向代理)
- [下载 API (第三方网关)](#下载-api-第三方网关)
- [网关状态 API](#网关状态-api)
- [文件上传 API (Crust Network)](#文件上传-api-crust-network)
- [存储状态 API](#存储状态-api)
- [错误处理](#错误处理)

---

## 认证 API

### 用户登录

验证用户或管理员密码并创建会话。

**端点**: `POST /api/auth/login`

**请求头**:
```http
Content-Type: application/json
```

**请求体**:
```json
{
  "password": "string",    // 用户密码
  "isAdmin": boolean      // 是否为管理员（可选，默认 false）
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "登录成功" | "管理员登录成功",
  "role": "user" | "admin"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "密码不能为空"
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "密码错误"
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "服务器错误"
}
```

**示例**:

```bash
# 普通用户登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "crustshare",
    "isAdmin": false
  }'

# 管理员登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "admin",
    "isAdmin": true
  }'
```

---

## 代理 API (CrustFiles.io 正向代理)

CrustShare 提供完整的 CrustFiles.io 正向代理功能，允许前端通过后端代理访问所有 CrustFiles.io API，无需直接跨域请求。

### 通用代理路由

所有 CrustFiles.io 的 API 都可以通过以下路由访问：

**代理端点**: `/api/proxy/[...path]`

**支持的 HTTP 方法**: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`

### 上传文件（通过代理）

将文件通过代理上传到 CrustFiles.io。

**端点**: `POST /api/proxy/upload`

**请求头**:
```http
Content-Type: multipart/form-data
Authorization: Bearer {token}  // 可选，如果需要认证
```

**请求体**:
- `file` (File): 要上传的文件

**成功响应** (200):
```json
{
  "success": true,
  "cid": "Qm...",           // IPFS CID
  "name": "example.pdf",    // 文件名
  "size": 1024,             // 文件大小（字节）
  "url": "https://crustfiles.io/ipfs/Qm..."  // CrustFiles.io 网关 URL
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "未找到文件"
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "未授权"
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "代理请求失败"
}
```

**示例**:

```bash
# 上传文件
curl -X POST http://localhost:5000/api/proxy/upload \
  -H "Authorization: Bearer your-token" \
  -F "file=@/path/to/file.pdf"
```

### 下载文件（通过代理）

通过代理从 CrustFiles.io 下载文件。

**端点**: `GET /api/proxy/ipfs/{cid}`

**请求头**:
```http
Authorization: Bearer {token}  // 可选，如果需要认证
```

**成功响应** (200):
```
二进制文件数据
```

**响应头**:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="example.pdf"
Content-Length: 1024
```

**错误响应** (404):
```json
{
  "success": false,
  "error": "HTTP 404"
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "代理请求失败"
}
```

**示例**:

```bash
# 下载文件
curl -X GET http://localhost:5000/api/proxy/ipfs/Qm... \
  -H "Authorization: Bearer your-token" \
  -o downloaded.pdf
```

### 获取文件信息

通过代理获取文件元数据。

**端点**: `GET /api/proxy/api/v0/file/stat?arg={cid}`

**请求头**:
```http
Authorization: Bearer {token}  // 可选
```

**成功响应** (200):
```json
{
  "Hash": "Qm...",
  "Size": 1024,
  "CumulativeSize": 2048,
  "Blocks": 2,
  "Type": "file"
}
```

**示例**:

```bash
curl "http://localhost:5000/api/proxy/api/v0/file/stat?arg=Qm..." \
  -H "Authorization: Bearer your-token"
```

### 自定义 API 代理

通过代理访问任意 CrustFiles.io API。

**端点**: `{METHOD} /api/proxy/{path}`

**支持的路径**:
- `/api/v0/add` - 添加文件
- `/api/v0/cat` - 获取文件内容
- `/api/v0/get` - 获取文件
- `/api/v0/ls` - 列出目录
- `/api/v0/file/ls` - 列出文件
- 任何其他 CrustFiles.io API 路径

**示例**:

```bash
# 获取 IPFS 节点版本
curl http://localhost:5000/api/proxy/api/v0/version

# 列出文件
curl "http://localhost:5000/api/proxy/api/v0/ls?arg=Qm..."

# 获取文件内容
curl "http://localhost:5000/api/proxy/api/v0/cat?arg=Qm..." \
  -H "Authorization: Bearer your-token"
```

### 前端使用

代理客户端库提供简单的 API 来调用代理。

```typescript
import { getProxy } from '@/lib/proxy';

// 创建代理实例
const proxy = getProxy('your-auth-token');

// 上传文件
const result = await proxy.upload(file, {
  onProgress: (progress) => {
    console.log(`${progress.percentage}%`);
  }
});

if (result.success) {
  console.log('CID:', result.cid);
  console.log('URL:', result.url);
}

// 下载文件
const blob = await proxy.downloadFile(cid, 'filename.pdf');

// 获取文件信息
const info = await proxy.getFileInfo(cid);

// 自定义 API 调用
const response = await proxy.get('/api/v0/version');
```

### 代理特性

#### 1. 完整透传
- ✅ 所有 HTTP 方法（GET、POST、PUT、DELETE、PATCH）
- ✅ 所有请求头（除了 hop-by-hop headers）
- ✅ 所有请求体（包括文件流）
- ✅ 所有响应（状态码、响应头、响应体）

#### 2. 鉴权保持
- ✅ Cookie 状态保持
- ✅ Authorization header 保持
- ✅ 自定义认证方式支持

#### 3. CORS 支持
- ✅ 自动处理 CORS 预检请求
- ✅ 添加 CORS 响应头
- ✅ 支持凭证

#### 4. 错误处理
- ✅ 完整的错误信息传递
- ✅ HTTP 状态码透传
- ✅ 详细的错误日志

### 安全性

#### 请求头过滤

自动过滤以下请求头（不转发到 CrustFiles.io）：
- `Connection`
- `Keep-Alive`
- `Proxy-Authenticate`
- `Proxy-Authorization`
- `TE`
- `Trailers`
- `Transfer-Encoding`
- `Upgrade`
- `Host`

#### 响应头过滤

自动过滤以下响应头：
- CORS headers（由 Next.js 重新设置）
- Hop-by-hop headers

### 环境变量

```env
# CrustFiles.io 网关地址
CRUSTFILES_BASE_URL=https://crustfiles.io

# （可选）Access Token
CRUSTFILES_ACCESS_TOKEN=your_access_token
```

---

## 下载 API (第三方网关)

通过第三方 IPFS 网关下载文件，与 CrustFiles.io 原生通道完全解耦。

### 获取下载 URL

通过文件 ID 和 CID 获取第三方网关的下载 URL。

**端点**: `GET /api/download?fileId={fileId}&cid={cid}`

**请求参数**:
- `fileId` (string, 必需): 项目文件 ID
- `cid` (string, 必需): IPFS CID

**成功响应** (200):
```json
{
  "success": true,
  "downloadUrl": "https://ipfs.io/ipfs/Qm...",
  "gatewayId": "ipfs-io",
  "expiresAt": "2024-01-30T00:00:00.000Z"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "缺少必要参数"
}
```

**错误响应** (503):
```json
{
  "success": false,
  "error": "下载服务暂不可用",
  "message": "所有网关暂时不可用，请稍后重试",
  "statistics": {
    "total": 6,
    "available": 0,
    "unavailable": 6
  }
}
```

**示例**:

```bash
# 获取下载 URL
curl "http://localhost:5000/api/download?fileId=file-xxx&cid=Qm..."
```

### 切换网关

切换到备用网关，用于当前网关不可用时的故障切换。

**端点**: `POST /api/download`

**请求头**:
```http
Content-Type: application/json
```

**请求体**:
```json
{
  "fileId": "string",        // 文件 ID
  "cid": "string",          // IPFS CID
  "fileName": "string",     // 文件名
  "gatewayId": "string"     // 可选，指定使用哪个网关
}
```

**成功响应** (200):
```json
{
  "success": true,
  "downloadUrl": "https://dweb.link/ipfs/Qm...",
  "gatewayId": "dweb-link",
  "message": "已切换到备用网关"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "缺少必要参数"
}
```

**错误响应** (503):
```json
{
  "success": false,
  "error": "下载服务暂不可用",
  "message": "所有网关暂时不可用，请稍后重试"
}
```

**示例**:

```bash
# 切换网关
curl -X POST http://localhost:5000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "file-xxx",
    "cid": "Qm...",
    "fileName": "example.pdf"
  }'

# 切换到指定网关
curl -X POST http://localhost:5000/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "file-xxx",
    "cid": "Qm...",
    "gatewayId": "ipfs-io"
  }'
```

### 清理下载映射

删除文件的下载映射，释放资源。

**端点**: `DELETE /api/download?fileId={fileId}`

**请求参数**:
- `fileId` (string, 必需): 项目文件 ID

**成功响应** (200):
```json
{
  "success": true,
  "message": "下载映射已清理"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "缺少 file ID"
}
```

**示例**:

```bash
# 清理下载映射
curl -X DELETE "http://localhost:5000/api/download?fileId=file-xxx"
```

---

## 网关状态 API

获取所有网关的状态和统计信息，用于监控和调试。

### 获取网关状态

获取所有网关的详细状态信息。

**端点**: `GET /api/gateway/status`

**成功响应** (200):
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
      "type": "ipfs",
      "url": "https://ipfs.io",
      "priority": 1,
      "enabled": true,
      "authRequired": false,
      "timeout": 5000,
      "maxRetries": 3,
      "state": {
        "status": "available",
        "responseTime": 120,
        "successRate": 100,
        "lastCheckTime": "2024-01-29T12:00:00.000Z",
        "lastError": null
      }
    }
  ],
  "timestamp": "2024-01-29T12:00:00.000Z"
}
```

**示例**:

```bash
# 获取网关状态
curl http://localhost:5000/api/gateway/status
```

### 网关状态说明

#### 状态值

| 状态 | 说明 |
|-----|------|
| `available` | 可用，正常工作 |
| `unavailable` | 不可用，无法访问 |
| `degraded` | 降级，响应时间过长 |
| `maintenance` | 维护中，暂时不可用 |

#### 网关统计

| 字段 | 说明 |
|-----|------|
| `total` | 总网关数 |
| `enabled` | 启用的网关数 |
| `available` | 可用的网关数 |
| `unavailable` | 不可用的网关数 |
| `degraded` | 降级的网关数 |
| `maintenance` | 维护中的网关数 |
| `averageResponseTime` | 平均响应时间（毫秒） |
| `averageSuccessRate` | 平均成功率（0-100） |

---

## 文件上传 API

### 上传文件到 Crust Network

将文件上传到 Crust Network（基于 IPFS）并获取 CID。

**端点**: `POST /api/crust/upload`

**请求头**:
```http
Content-Type: multipart/form-data
```

**请求体**:
- `file` (File): 要上传的文件

**成功响应** (200):
```json
{
  "success": true,
  "cid": "Qm...",           // IPFS CID
  "name": "example.pdf",    // 文件名
  "size": 1024,             // 文件大小（字节）
  "url": "https://ipfs.io/ipfs/Qm..."  // IPFS 网关 URL
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "未找到文件"
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "上传失败"
}
```

**示例**:

```bash
curl -X POST http://localhost:5000/api/crust/upload \
  -F "file=@/path/to/file.pdf"
```

---

## 存储状态 API

### 获取存储状态

获取当前的存储使用情况和配额信息。

**端点**: `GET /api/crust/status`

**请求头**:
```http
Content-Type: application/json
```

**成功响应** (200):
```json
{
  "success": true,
  "status": {
    "totalStorage": 10737418240,  // 总存储空间（字节）
    "usedStorage": 536870912,     // 已使用存储（字节）
    "availableStorage": 10219547328, // 可用存储（字节）
    "fileCount": 25,              // 文件数量
    "lastUpdated": "2024-01-29T02:35:21.000Z"
  }
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "获取存储状态失败"
}
```

**示例**:

```bash
curl http://localhost:5000/api/crust/status
```

---

## 错误处理

所有 API 遵循统一的错误响应格式。

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/密码错误 |
| 404 | 资源未找到 |
| 500 | 服务器内部错误 |

### 常见错误

#### 1. 未授权 (401)

```json
{
  "success": false,
  "error": "密码错误"
}
```

**解决方法**：检查密码是否正确，使用环境变量中的密码哈希。

#### 2. 参数错误 (400)

```json
{
  "success": false,
  "error": "未找到文件"
}
```

**解决方法**：确保请求体中包含必需的参数。

#### 3. 服务器错误 (500)

```json
{
  "success": false,
  "error": "上传失败"
}
```

**解决方法**：
- 检查服务器日志
- 确认网络连接正常
- 验证文件大小限制

---

## 认证机制

当前版本使用简单的密码认证：

1. **密码哈希验证**
   - 使用 SHA-256 哈希算法
   - 密码哈希存储在环境变量中
   - 支持用户和管理员两种角色

2. **会话管理**
   - 使用 localStorage 存储会话
   - 可选集成 Upstash Redis 进行集中会话管理
   - 默认会话时长：24 小时

3. **JWT 支持**
   - 支持使用 JWT 进行会话验证
   - JWT 密钥通过环境变量配置
   - 令牌签名：HS256

---

## 未来功能

计划在未来版本中添加的 API：

- [ ] 文件下载 API
- [ ] 文件删除 API
- [ ] 文件元数据管理 API
- [ ] 文件夹管理 API
- [ ] 标签管理 API
- [ ] 权限管理 API
- [ ] 版本历史 API
- [ ] 分享链接生成 API

---

## 使用示例

### 完整的上传流程

```javascript
// 1. 登录获取会话
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: 'crustshare',
    isAdmin: false
  })
});

const loginData = await loginResponse.json();
if (!loginData.success) {
  throw new Error('登录失败');
}

// 2. 上传文件
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/crust/upload', {
  method: 'POST',
  body: formData
});

const uploadData = await uploadResponse.json();
if (uploadData.success) {
  console.log('上传成功，CID:', uploadData.cid);
}
```

### 获取存储状态

```javascript
const statusResponse = await fetch('/api/crust/status');
const statusData = await statusResponse.json();

if (statusData.success) {
  const { totalStorage, usedStorage, fileCount } = statusData.status;
  const usedPercent = ((usedStorage / totalStorage) * 100).toFixed(2);
  console.log(`已使用: ${usedPercent}% (${fileCount} 个文件)`);
}
```

---

## 安全建议

1. **使用 HTTPS**
   - 生产环境必须使用 HTTPS
   - 保护密码和会话令牌

2. **定期更新密码**
   - 定期轮换用户和管理员密码
   - 使用强密码策略

3. **保护 JWT 密钥**
   - 不要在代码中硬编码 JWT 密钥
   - 使用环境变量管理敏感信息

4. **限制文件大小**
   - 设置合理的文件大小限制
   - 防止恶意大文件上传

5. **监控和日志**
   - 记录所有 API 调用
   - 监控异常行为

---

## 技术支持

如有问题或建议，请通过以下方式联系：

- GitHub Issues: https://github.com/SpiritoXI/crustshare/issues
- 文档: https://github.com/SpiritoXI/crustshare/blob/main/README.md
