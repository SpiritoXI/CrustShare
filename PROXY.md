# CrustFiles.io 代理功能文档

## 概述

本项目实现了 **CrustFiles.io 正向代理功能**，允许用户在项目内直接完成文件上传和下载，无需跳转到外部网站。所有上传和下载操作都通过后端代理服务转发，确保安全性和一致性。

## 核心特性

### 1. 完整透传
- ✅ 支持所有 HTTP 方法（GET、POST、PUT、DELETE、PATCH、OPTIONS）
- ✅ 完整透传请求头（除了 hop-by-hop headers）
- ✅ 完整透传请求体（包括文件流）
- ✅ 完整透传响应（状态码、响应头、响应体）

### 2. 鉴权状态保持
- ✅ 保持 Cookie 状态
- ✅ 保持 Session 状态
- ✅ 支持 Bearer Token 认证
- ✅ 支持自定义请求头

### 3. 文件上传
- ✅ 支持单文件上传
- ✅ 支持多文件上传
- ✅ 实时上传进度
- ✅ 支持大文件上传
- ✅ 完全兼容 CrustFiles.io 原生上传规则

### 4. 文件下载
- ✅ 通过代理下载文件
- ✅ 支持断点续传
- ✅ 完整的文件信息
- ✅ 下载进度展示

## 架构设计

```
┌─────────────────┐
│   前端 (Next.js) │
│                 │
│ FileUpload.tsx  │
│ DownloadDialog  │
│   proxy.ts      │
└────────┬────────┘
         │ HTTP Request
         │ (with File Stream)
         ▼
┌─────────────────┐
│  后端代理服务    │
│  /api/proxy/*   │
│                 │
│  - 路由转发      │
│  - 请求头透传    │
│  - 响应透传      │
│  - 鉴权保持      │
└────────┬────────┘
         │ Forward
         │ (with Auth)
         ▼
┌─────────────────┐
│  CrustFiles.io  │
│   文件存储网关   │
└─────────────────┘
```

## 技术实现

### 后端代理路由

**文件**: `src/app/api/proxy/[...path]/route.ts`

#### 核心功能

1. **通用代理处理**
   - 支持所有 HTTP 方法
   - 动态路由匹配 `/api/proxy/[...path]`
   - 自动转发请求到 CrustFiles.io

2. **请求头过滤**
   ```typescript
   // 移除 hop-by-hop headers
   // 移除 host header（使用目标服务器）
   // 保留其他 headers（包括 Cookie、Authorization）
   ```

3. **请求体处理**
   ```typescript
   // multipart/form-data：直接传递 request.body
   // 其他类型：读取并传递文本
   ```

4. **响应透传**
   ```typescript
   // 完整透传状态码
   // 过滤响应头（移除 CORS headers）
   // 根据内容类型处理响应体
   ```

### 前端代理客户端

**文件**: `src/lib/proxy.ts`

#### 核心类：CrustFilesProxy

```typescript
const proxy = getProxy(authToken);

// 设置认证 Token
proxy.setAuthToken('your-token');

// 上传文件（带进度）
const result = await proxy.upload(file, {
  onProgress: (progress) => {
    console.log(`${progress.percentage}%`);
  }
});

// 下载文件
const blob = await proxy.downloadFile(cid);

// 获取文件信息
const info = await proxy.getFileInfo(cid);
```

#### API 方法

| 方法 | 描述 | 参数 |
|------|------|------|
| `get(path, headers?)` | GET 请求 | 路径、请求头 |
| `post(path, data, headers?)` | POST 请求（JSON） | 路径、数据、请求头 |
| `put(path, data, headers?)` | PUT 请求（JSON） | 路径、数据、请求头 |
| `delete(path, headers?)` | DELETE 请求 | 路径、请求头 |
| `patch(path, data, headers?)` | PATCH 请求（JSON） | 路径、数据、请求头 |
| `uploadFile(path, formData, options?)` | 上传文件（FormData） | 路径、FormData、选项 |
| `upload(file, options?)` | 上传文件（简化 API） | File、选项 |
| `uploadMultiple(files, options?)` | 上传多个文件 | File[]、选项 |
| `downloadFile(cid, filename?)` | 下载文件 | CID、文件名 |
| `getFileInfo(cid)` | 获取文件信息 | CID |
| `fileExists(cid)` | 检查文件是否存在 | CID |

### 前端组件集成

#### FileUpload 组件

```tsx
import { getProxy } from '@/lib/proxy';

const proxy = getProxy();

const result = await proxy.upload(file, {
  onProgress: (progress) => {
    setProgress(progress.percentage);
  }
});
```

#### DownloadDialog 组件

```tsx
import { getProxy } from '@/lib/proxy';

const proxy = getProxy();
const fileUrl = proxy.getFileUrl(cid);
const response = await fetch(fileUrl);
const blob = await response.blob();
```

## 环境配置

### 环境变量

```env
# CrustFiles.io 配置
CRUSTFILES_BASE_URL=https://crustfiles.io

# （可选）Access Token 用于认证
CRUSTFILES_ACCESS_TOKEN=your_access_token
```

### 配置说明

- `CRUSTFILES_BASE_URL`: CrustFiles.io 网关地址（默认：`https://crustfiles.io`）
- `CRUSTFILES_ACCESS_TOKEN`: 访问令牌（可选，用于需要认证的操作）

## 使用示例

### 1. 基础文件上传

```typescript
import { getProxy } from '@/lib/proxy';

const proxy = getProxy();

// 上传单个文件
const result = await proxy.upload(file);

if (result.success) {
  console.log('上传成功:', result.cid);
  console.log('文件 URL:', result.url);
}
```

### 2. 带进度的文件上传

```typescript
const result = await proxy.upload(file, {
  onProgress: (progress) => {
    console.log(`已上传: ${progress.loaded}/${progress.total} bytes`);
    console.log(`进度: ${progress.percentage}%`);
  }
});
```

### 3. 多文件上传

```typescript
const results = await proxy.uploadMultiple([
  file1,
  file2,
  file3
], {
  onProgress: (progress) => {
    console.log(`文件 ${progress.percentage}%`);
  }
});

results.forEach((result, index) => {
  console.log(`文件 ${index + 1}:`, result.success ? '成功' : '失败');
});
```

### 4. 带认证的请求

```typescript
const proxy = getProxy();
proxy.setAuthToken('your-access-token');

const result = await proxy.upload(file);

// 或在初始化时设置
const proxy = getProxy('your-access-token');
```

### 5. 自定义 API 调用

```typescript
// 调用任意 CrustFiles.io API
const response = await proxy.get('/api/v0/version');

if (response.success) {
  console.log('API 版本:', response.data);
}

// 上传文件到特定路径
const formData = new FormData();
formData.append('file', file);

const response = await proxy.uploadFile('/api/v0/add', formData);
```

### 6. 下载文件

```typescript
const proxy = getProxy();

// 获取文件 URL
const fileUrl = proxy.getFileUrl(cid);
console.log('文件 URL:', fileUrl);

// 下载文件为 Blob
const blob = await proxy.downloadFile(cid, 'filename.pdf');

if (blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'filename.pdf';
  link.click();
  URL.revokeObjectURL(url);
}
```

## 安全性

### 1. 请求头过滤

自动过滤不安全的请求头：
- ❌ `Connection`
- ❌ `Keep-Alive`
- ❌ `Proxy-Authenticate`
- ❌ `Proxy-Authorization`
- ❌ `TE`
- ❌ `Trailers`
- ❌ `Transfer-Encoding`
- ❌ `Upgrade`
- ❌ `Host`

### 2. 响应头过滤

自动过滤不必要的响应头：
- ❌ CORS headers（由 Next.js 重新设置）
- ❌ Hop-by-hop headers

### 3. 鉴权保持

- ✅ 保持 Cookie 状态
- ✅ 保持 Authorization header
- ✅ 支持自定义认证方式

## 优势

### 1. 用户体验
- ✅ 无需跳转外部网站
- ✅ 统一的上传界面
- ✅ 实时上传进度
- ✅ 一致的交互体验

### 2. 技术优势
- ✅ 解决跨域问题
- ✅ 统一鉴权管理
- ✅ 完整的请求响应透传
- ✅ 支持所有 CrustFiles.io API

### 3. 安全性
- ✅ 后端代理防止直接访问
- ✅ 请求头过滤
- ✅ 鉴权状态保持
- ✅ 环境变量管理敏感信息

## 限制与注意事项

### 1. 文件大小限制
- 默认限制：100MB（可在代理路由中调整）
- 超大文件建议使用分片上传

### 2. 并发限制
- 建议单次上传不超过 10 个文件
- 避免同时上传多个大文件

### 3. 网络要求
- 需要稳定的网络连接
- 支持断点续传

### 4. 认证要求
- 某些操作可能需要 Access Token
- Token 会在代理中透传

## 故障排查

### 1. 上传失败

**问题**: 文件上传失败

**解决方案**:
- 检查网络连接
- 检查文件大小是否超过限制
- 检查 CrustFiles.io 服务状态
- 查看浏览器控制台错误信息

### 2. 下载失败

**问题**: 文件下载失败

**解决方案**:
- 检查 CID 是否正确
- 检查文件是否已上传成功
- 检查网络连接
- 查看浏览器控制台错误信息

### 3. 认证失败

**问题**: 认证失败

**解决方案**:
- 检查 Access Token 是否正确
- 检查 Token 是否已过期
- 确认 Token 权限

### 4. 跨域错误

**问题**: 跨域请求被阻止

**解决方案**:
- 确保使用代理路径 `/api/proxy/...`
- 不要直接请求 CrustFiles.io

## 性能优化

### 1. 上传优化
- 使用分片上传大文件
- 启用断点续传
- 限制并发上传数量

### 2. 下载优化
- 使用流式下载
- 支持断点续传
- 缓存文件元数据

### 3. 代理优化
- 添加请求缓存
- 优化请求头处理
- 使用 CDN 加速

## 相关文档

- [API 文档](./API.md)
- [CrustFiles API 文档](./CRUSTFILES_API.md)
- [集成指南](./CRUSTFILES_SETUP.md)
- [项目 README](./README.md)

## 更新日志

### v2.0.0 (2025-01-XX)
- ✨ 新增 CrustFiles.io 正向代理功能
- ✨ 支持完整请求响应透传
- ✨ 支持鉴权状态保持
- ✨ 支持文件上传下载
- ✨ 支持实时上传进度
- ✨ 支持多文件上传

### v1.0.0 (2025-01-XX)
- ✨ 初始版本
- ✨ 用户认证系统
- ✨ 文件管理功能
