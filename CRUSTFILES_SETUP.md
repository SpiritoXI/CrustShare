# CrustFiles.io 集成指南

本文档说明如何配置 CrustFiles.io 进行文件上传和下载。

---

## 概述

CrustShare 现已集成 CrustFiles.io 网关，提供更稳定和快速的文件上传下载体验。

**主要变化**：
- ✅ 文件上传到 CrustFiles.io 网关
- ✅ 使用 Access Token 进行认证
- ✅ 文件下载使用 CrustFiles.io 网关
- ✅ 返回标准的 IPFS CID
- ✅ 文件大小限制：1GB

---

## 重要说明

### API 路径与认证方式

⚠️ **当前状态**：代码中的 CrustFiles.io API 路径和认证方式基于假设，**需要根据实际 API 文档进行调整**。

#### 需要确认的内容

1. **API 路径**：
   - 当前假设：`/api/v1/upload`
   - 可能的替代路径：
     - `/api/upload`
     - `/upload`
     - `/api/files/upload`
   - **请查阅 CrustFiles.io 的官方 API 文档确认正确的路径**

2. **认证方式**：
   - 当前假设：`access_token` 作为 FormData 参数
   - 可能的替代方式：
     - `Authorization: Bearer {token}` header
     - `X-Access-Token` header
   - **请查阅 CrustFiles.io 的官方 API 文档确认正确的认证方式**

3. **请求参数**：
   - 当前假设：FormData 包含 `file` 字段
   - 可能需要其他参数：`filename`, `content_type` 等

#### 如何确认正确的 API 规格

1. 访问 [CrustFiles.io](https://crustfiles.io/) 查找 API 文档
2. 或联系 CrustFiles.io 支持团队获取 API 规格
3. 使用工具（如 Postman）测试不同的 API 路径和认证方式

#### 临时解决方案

如果 CrustFiles.io 的 API 不符合预期，可以考虑：
- 使用其他 IPFS 网关（如 Pinata、Web3.Storage）
- 使用对象存储服务（如 AWS S3、阿里云 OSS）
- 或等待 CrustFiles.io 提供官方 API 文档

---

## 配置步骤

### 1. 获取 CrustFiles.io Access Token

1. 访问 [CrustFiles.io](https://crustfiles.io/)
2. 注册账户或登录
3. 在设置中获取 Access Token
4. 保存 Token

### 2. 更新环境变量

在 `.env` 文件中添加：

```env
# CrustFiles.io 配置
CRUSTFILES_ACCESS_TOKEN=your_actual_access_token
CRUSTFILES_BASE_URL=https://crustfiles.io
```

### 3. 重启服务

```bash
# 停止当前服务（Ctrl + C）
# 重新启动
pnpm dev
```

---

## API 使用

### 上传文件

```bash
curl -X POST http://localhost:5000/api/crustfiles/upload \
  -F "file=@/path/to/file.pdf"
```

### 获取文件 URL

```bash
curl "http://localhost:5000/api/crustfiles/upload?cid=Qm..."
```

### 前端使用

```typescript
// 上传文件
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/crustfiles/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// data.cid - 文件 CID
// data.url - 文件访问 URL
```

---

## 核心功能

### 1. 用户认证

**保持不变** - 基于自定义密码的认证系统：

- 密码加密：SHA-256
- 角色管理：普通用户和管理员
- 会话存储：localStorage 或 Upstash Redis

### 2. 文件上传

**已更新** - 上传到 CrustFiles.io：

- API 端点：`/api/crustfiles/upload`
- 认证方式：Access Token
- 文件大小限制：1GB
- 返回：IPFS CID + 访问 URL

### 3. 文件下载

**已更新** - 从 CrustFiles.io 网关下载：

- 网关地址：`https://crustfiles.io/ipfs/{cid}`
- 直接通过浏览器下载
- 支持断点续传

---

## 技术实现

### 客户端库 (`src/lib/crustfiles.ts`)

```typescript
import { CrustFilesClient } from '@/lib/crustfiles';

const client = new CrustFilesClient(accessToken, baseUrl);

// 上传文件
const result = await client.uploadFile(file, {
  fileName: 'file.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
});

// 获取文件 URL
const url = client.getFileUrl(cid);

// 下载文件
const buffer = await client.downloadFile(cid);
```

### API 路由 (`src/app/api/crustfiles/upload/route.ts`)

- POST: 上传文件
- GET: 获取文件下载 URL

### 前端组件

- `FileUpload.tsx` - 文件上传界面
- `DownloadDialog.tsx` - 文件下载界面

---

## 迁移指南

如果你之前使用旧的 Crust Network API：

### 1. 环境变量

添加新的环境变量：

```env
CRUSTFILES_ACCESS_TOKEN=your_token
```

### 2. API 端点

旧端点：`/api/crust/upload`
新端点：`/api/crustfiles/upload`

### 3. 前端代码

无需修改前端代码，只需确保环境变量已配置。

---

## 故障排除

### 问题 1：上传失败 - "CrustFiles 配置未完成"

**原因**：未配置 Access Token

**解决**：
```env
CRUSTFILES_ACCESS_TOKEN=your_actual_token
```

### 问题 2：上传失败 - "405 Not Allowed"

**原因**：API 路径或认证方式不正确

**解决**：
1. 检查日志中的 `[CrustFiles] 上传 URL` 确认使用的 API 路径
2. 查阅 CrustFiles.io 的官方 API 文档
3. 修改 `src/lib/crustfiles.ts` 中的 `uploadUrl` 变量
4. 或者修改认证方式（Authorization header vs FormData 参数）

**示例修改**：

```typescript
// 如果需要使用 Authorization header
const response = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.accessToken}`,
  },
  body: formData, // 注意：FormData 可能不支持自定义 headers
});
```

### 问题 3：上传失败 - "服务器返回无效的响应"

**原因**：
1. API 返回了 HTML 而不是 JSON（通常表示 404/405/500 错误）
2. Access Token 无效
3. API 路径不正确

**解决**：
1. 检查日志中的 `[CrustFiles] 上传响应内容`
2. 验证 Access Token 是否有效
3. 查阅 CrustFiles.io 的官方 API 文档确认正确的请求格式

### 问题 4：上传失败 - "文件大小超过限制"

**原因**：文件超过 1GB

**解决**：压缩文件或使用其他方式上传

### 问题 5：下载失败

**原因**：网络问题或文件不存在

**解决**：
1. 检查网络连接
2. 验证 CID 是否正确
3. 尝试使用其他网关：`https://ipfs.io/ipfs/{cid}`

---

## 调试建议

### 启用详细日志

代码中已添加详细日志，可以在控制台查看：

```typescript
console.log('[CrustFiles] 开始上传文件:', { fileName, fileSize, baseUrl, hasAccessToken });
console.log('[CrustFiles] 上传 URL:', uploadUrl);
console.log('[CrustFiles] 上传响应状态:', response.status);
console.log('[CrustFiles] 上传响应内容:', responseText);
```

### 使用 curl 测试

```bash
# 测试 API 路径是否可达
curl -X POST https://crustfiles.io/api/v1/upload

# 测试不同的 API 路径
curl -X POST https://crustfiles.io/api/upload
curl -X POST https://crustfiles.io/upload
```

### 查看日志

```bash
# 查看开发日志
tail -f /app/work/logs/bypass/dev.log

# 搜索 CrustFiles 相关日志
tail -f /app/work/logs/bypass/dev.log | grep "CrustFiles"
```

---

## 最佳实践

### 安全性

1. ✅ 使用环境变量存储 Access Token
2. ✅ 不要在代码中硬编码 Token
3. ✅ 定期轮换 Access Token
4. ✅ 限制文件大小

### 性能

1. ✅ 使用分片上传大文件（未来功能）
2. ✅ 启用断点续传（未来功能）
3. ✅ 缓存文件元数据
4. ✅ 使用 CDN 加速（可选）

---

## 未来计划

- [ ] 支持更大的文件（> 1GB）
- [ ] 分片上传
- [ ] 断点续传
- [ ] 批量上传
- [ ] 上传速度优化
- [ ] 文件预览增强

---

## 相关文档

- [API 文档](API.md)
- [CrustFiles API 详解](CRUSTFILES_API.md)
- [部署文档](DEPLOYMENT.md)
- [密码配置](PASSWORD_CONFIG.md)

---

## 技术支持

如有问题，请：

1. 检查 [API 文档](API.md)
2. 查看 [故障排除](#故障排除)
3. 提交 [GitHub Issue](https://github.com/SpiritoXI/crustshare/issues)

---

**CrustFiles.io 集成完成！** 🎉
