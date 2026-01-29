# 直连上传说明

## 概述

CrustShare 采用直连模式将文件直接上传到 CrustFiles.io，绕过了 Vercel 的请求体大小限制，支持上传更大的文件。

## 工作原理

### 上传流程

```
用户浏览器 → CrustFiles.io API
```

1. 用户在应用界面配置 Access Token
2. Token 保存到浏览器的 localStorage
3. 上传文件时，前端直接调用 CrustFiles.io API
4. 使用 XMLHttpRequest 实现上传进度显示
5. 上传成功后，创建下载映射供下载使用

### 优势

- ✅ **绕过 Vercel 限制** - 不受 Vercel 免费层 4.5MB 限制
- ✅ **支持大文件** - 支持 100MB 文件上传
- ✅ **上传速度快** - 直接连接，不经过代理
- ✅ **实时进度** - 使用 XMLHttpRequest 实现精确进度显示

## 配置 Access Token

### 获取 Access Token

1. 访问 [CrustFiles.io](https://crustfiles.io/)
2. 注册或登录账户
3. 进入用户设置
4. 找到 API Access Token 部分
5. 复制 Token

### 在应用中配置

1. 登录后，点击右上角的设置图标（⚙️）
2. 点击"配置 Access Token"
3. 粘贴您的 Access Token
4. 点击"保存配置"

### Token 存储

- Token 保存在浏览器的 `localStorage` 中
- 键名：`crustshare_token`
- 注意：清除浏览器数据会删除 Token，需要重新配置

## API 文档

### CrustFiles Direct Client

```typescript
import { getCrustFilesDirectClient } from '@/lib/crustfiles-direct';

// 获取客户端实例
const client = getCrustFilesDirectClient(authToken);

// 上传文件
const result = await client.upload(file, {
  onProgress: (progress) => {
    console.log(`${progress.percentage}%`);
  }
});

// 检查结果
if (result.success) {
  console.log('上传成功:', result.cid);
} else {
  console.error('上传失败:', result.error);
}
```

### 上传选项

```typescript
interface DirectUploadOptions {
  onProgress?: (progress: DirectUploadProgress) => void;
  headers?: Record<string, string>;
}
```

### 上传结果

```typescript
interface DirectUploadResult {
  success: boolean;
  cid?: string;        // IPFS CID
  name?: string;       // 文件名
  size?: number;       // 文件大小
  url?: string;        // 访问 URL
  error?: string;      // 错误信息
}
```

## 文件大小限制

- **当前限制**: 100MB
- **限制来源**: CrustFiles.io API 限制
- **未来计划**: 支持分片上传以支持更大文件

## 错误处理

### 常见错误

#### 1. 未配置 Access Token

**错误信息**: `请先配置 CrustFiles.io Access Token`

**解决方案**:
1. 点击右上角设置图标
2. 配置 Access Token

#### 2. 网络错误

**错误信息**: `网络错误，请检查网络连接`

**解决方案**:
1. 检查网络连接
2. 检查 CrustFiles.io 服务状态
3. 尝试使用 VPN

#### 3. 上传超时

**错误信息**: `上传超时，请重试`

**解决方案**:
1. 检查网络速度
2. 尝试上传较小的文件
3. 增加超时时间（当前 30 分钟）

#### 4. 认证失败

**错误信息**: `HTTP 401: Unauthorized`

**解决方案**:
1. 检查 Access Token 是否正确
2. 重新获取 Access Token
3. 确认 Token 未过期

## 安全性

### Token 保护

- Token 使用密码类型输入框，不会明文显示
- Token 保存在 localStorage，仅客户端使用
- 不会将 Token 发送到除了 CrustFiles.io 以外的服务器

### 建议

- 不要分享您的 Access Token
- 定期更换 Access Token
- 在公共设备上使用后清除 Token

## 与代理模式对比

| 特性 | 直连模式 | 代理模式 |
|------|---------|---------|
| 文件大小限制 | 100MB | 4.5MB |
| 上传速度 | 快 | 慢（经过代理） |
| Token 配置 | 客户端配置 | 服务端配置 |
| 隐私性 | Token 在客户端 | Token 在服务端 |
| CORS | 需要支持 | 不需要 |

## 未来计划

- [ ] 支持分片上传（支持超大文件）
- [ ] 支持断点续传
- [ ] 支持批量上传
- [ ] 优化上传速度
- [ ] 添加上传队列管理
- [ ] 支持上传失败重试
