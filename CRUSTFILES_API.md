# API 文档 - CrustFiles.io 更新

本文档描述 CrustFiles.io 集成的 API 接口。

---

## CrustFiles.io API

### 上传文件

**端点**: `POST /api/crustfiles/upload`

**请求头**:
```http
Content-Type: multipart/form-data
```

**请求体**:
- `file` (File): 要上传的文件

**环境变量**:
```env
CRUSTFILES_ACCESS_TOKEN=your_access_token
CRUSTFILES_BASE_URL=https://crustfiles.io
```

**成功响应** (200):
```json
{
  "success": true,
  "cid": "Qm...",
  "name": "example.pdf",
  "size": 1024,
  "url": "https://crustfiles.io/ipfs/Qm..."
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "未找到文件" | "文件大小超过限制（最大 1GB）"
}
```

**错误响应** (500):
```json
{
  "success": false,
  "error": "CrustFiles 配置未完成" | "上传失败"
}
```

**示例**:

```bash
curl -X POST http://localhost:5000/api/crustfiles/upload \
  -F "file=@/path/to/file.pdf"
```

---

## 配置说明

### 获取 CrustFiles.io Access Token

1. 访问 https://crustfiles.io
2. 注册/登录账户
3. 获取 Access Token
4. 添加到环境变量：

```env
CRUSTFILES_ACCESS_TOKEN=your_actual_token
```

---

## 文件下载

文件通过 CrustFiles.io 网关下载：

```typescript
const downloadUrl = `https://crustfiles.io/ipfs/${cid}`;
const response = await fetch(downloadUrl);
const blob = await response.blob();
```

---

## 特性

- ✅ 基于 CrustFiles.io 网关
- ✅ 使用 Access Token 认证
- ✅ 返回 IPFS CID
- ✅ 文件大小限制：1GB
- ✅ 支持所有文件类型
