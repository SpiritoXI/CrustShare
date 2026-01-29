# CrustShare

<div align="center">

![CrustShare Logo](./public/icon.png)

**去中心化文件存储平台**

基于 Crust Network 和 IPFS 的安全、私有、去中心化文件存储解决方案

[演示](#) · [文档](#文档) · [贡献](#贡献)

</div>

---

## ✨ 特性

- 🌐 **去中心化存储** - 基于 Crust Network 和 IPFS 技术
- ⚡ **直连上传** - 直接连接 CrustFiles.io，绕过 Vercel 限制，支持大文件上传
- 🌉 **多网关下载** - 智能调度多个 IPFS 网关，高可用下载
- 📁 **文件夹管理** - 支持文件夹层级和嵌套
- 🏷️ **标签系统** - 灵活的文件标签分类
- 📜 **版本控制** - 文件版本历史和恢复
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 👁️ **文件预览** - 支持图片、视频、音频等格式预览
- 🎨 **优雅 UI** - 淡雅水晶风格，提供良好的用户体验
- 💾 **本地缓存** - 智能缓存机制，提升性能
- 🔄 **故障切换** - 网关自动故障切换，保障下载稳定
- 📊 **状态监控** - 实时监控网关状态和健康度
- 🔒 **安全认证** - 基于自定义密码的认证系统
- 📦 **大文件支持** - 支持最大 100MB 文件上传（直连模式）

---

## 🚀 快速开始

### 环境要求

- Node.js 24+
- pnpm 包管理器

### 安装

```bash
# 克隆仓库
git clone https://github.com/SpiritoXI/crustshare.git
cd crustshare

# 安装依赖
pnpm install
```

### 配置环境变量

#### 方式一：应用内配置（推荐）

直接在应用界面配置：

1. 启动应用后，点击右上角的设置图标（⚙️）
2. 点击"配置 Access Token"
3. 输入您的 CrustFiles.io Access Token
4. Token 会保存到浏览器的 localStorage 中

**如何获取 Access Token**：
1. 访问 [CrustFiles.io](https://crustfiles.io/)
2. 注册或登录您的账户
3. 在用户设置中找到 API Access Token
4. 复制 Token 并粘贴到配置对话框中

#### 方式二：环境变量配置（可选）

如果要使用环境变量配置，可以创建 `.env` 文件：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，配置以下变量：

```env
# PIN 码配置（用于用户认证）
# 默认 PIN 码：123456
PIN_CODE=123456

# CrustFiles.io 配置（可选，用于代理模式）
CRUSTFILES_ACCESS_TOKEN=your_crustfiles_access_token_here
CRUSTFILES_BASE_URL=https://crustfiles.io

# Upstash Redis 配置（可选，用于生产环境会话管理）
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**PIN 码说明**：
- 默认 PIN 码：`123456`
- 建议：使用 4-6 位数字，易于记忆
- 修改：在环境变量中设置 `PIN_CODE`

**直连上传说明**：
- 应用使用直连模式上传文件到 CrustFiles.io
- 支持最大 100MB 文件上传
- 需要配置 Access Token（在应用界面配置）
- 不受 Vercel 请求体大小限制

### 开发

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:5000
```

### 构建

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

---

## 📖 文档

### 项目结构

```
crustshare/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证 API
│   │   │   │   └── login/     # 登录接口
│   │   │   └── crust/         # Crust Network API
│   │   │       ├── status/    # 存储状态
│   │   │       ├── storage/   # 存储管理
│   │   │       └── upload/    # 文件上传
│   │   ├── login/             # 登录页面
│   │   ├── dashboard/         # 主仪表板
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 基础组件
│   │   ├── Dashboard.tsx     # 主仪表板
│   │   ├── FileList.tsx      # 文件列表
│   │   ├── FileUpload.tsx    # 文件上传
│   │   ├── FolderTree.tsx    # 文件夹树
│   │   ├── TagManager.tsx    # 标签管理
│   │   ├── VersionHistory.tsx # 版本历史
│   │   └── LoginPage.tsx     # 登录页面
│   ├── lib/                   # 工具库
│   │   ├── auth.ts           # 认证工具（密码哈希）
│   │   ├── redis.ts          # Redis 客户端（会话管理）
│   │   ├── crust.ts          # Crust Network 客户端
│   │   └── cache.ts          # 缓存工具
│   ├── store/                 # 状态管理
│   │   └── useStore.ts       # Zustand 状态
│   └── hooks/                 # 自定义 Hooks
├── public/                    # 静态资源
├── scripts/                   # 工具脚本
│   └── generate-config.js    # 配置生成脚本
├── .coze                      # Coze CLI 配置
├── .env                       # 环境变量（不提交）
├── .env.example               # 环境变量模板
└── package.json              # 项目配置
```

### 核心功能

#### 1. 用户认证

基于 PIN 码的认证系统：

```typescript
// 登录验证
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pin: '123456'
  })
});
```

- **PIN 码认证**：简单易记的 4-6 位数字
- **会话存储**：localStorage
- **单用户模式**：简化认证，无需角色管理

#### 2. CrustFiles.io 代理（正向代理）

完整的 CrustFiles.io 正向代理功能，无需直接跨域请求：

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

// 下载文件
const blob = await proxy.downloadFile(cid, 'filename.pdf');

// 获取文件信息
const info = await proxy.getFileInfo(cid);

// 自定义 API 调用
const response = await proxy.get('/api/v0/version');
```

**核心特性**：
- ✅ 完整透传所有 HTTP 方法（GET、POST、PUT、DELETE、PATCH）
- ✅ 完整透传请求头和请求体（包括文件流）
- ✅ 完整透传响应（状态码、响应头、响应体）
- ✅ 保持鉴权状态（Cookie、Session、Token）
- ✅ 支持实时上传进度
- ✅ 支持单文件和多文件上传
- ✅ 完全兼容 CrustFiles.io 原生 API

详细文档：[代理功能文档](./PROXY.md)

#### 3. 第三方网关下载（与上传链路解耦）

通过多个第三方 IPFS 网关智能调度下载，与 CrustFiles.io 原生通道完全解耦：

```typescript
// 获取下载 URL（自动选择最优网关）
const response = await fetch(`/api/download?fileId=${fileId}&cid=${cid}`);
const data = await response.json();
// data.downloadUrl: https://ipfs.io/ipfs/Qm...
// data.gatewayId: ipfs-io

// 触发下载
const link = document.createElement('a');
link.href = data.downloadUrl;
link.download = fileName;
link.click();

// 切换网关（故障切换）
const retryResponse = await fetch('/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileId, cid }),
});
const retryData = await retryResponse.json();
// 自动选择备用网关
```

**核心特性**：
- ✅ 多网关智能调度（自动选择最优网关）
- ✅ 实时健康检测（20 秒检测一次）
- ✅ 自动故障切换（网关不可用时自动切换）
- ✅ 网关状态监控（响应时间、成功率）
- ✅ 状态缓存机制（减少检测频次）
- ✅ 完整日志记录（上传、下载、网关检测）

**默认网关列表**：
1. IPFS.io Gateway (https://ipfs.io) - 优先级 1
2. dweb.link Gateway (https://dweb.link) - 优先级 2
3. Cloudflare IPFS Gateway (https://cloudflare-ipfs.com) - 优先级 3
4. JBO ETH Limo Gateway (https://jbo-eth.limo) - 优先级 4
5. NFTStorage Gateway (https://nftstorage.link) - 优先级 5
6. CrustFiles.io Gateway (https://crustfiles.io) - 优先级 10（备用）

详细文档：[网关功能文档](./GATEWAY.md)

#### 4. 文件上传

完整的 CrustFiles.io 正向代理功能，无需直接跨域请求：

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

// 下载文件
const blob = await proxy.downloadFile(cid, 'filename.pdf');

// 获取文件信息
const info = await proxy.getFileInfo(cid);

// 自定义 API 调用
const response = await proxy.get('/api/v0/version');
```

**核心特性**：
- ✅ 完整透传所有 HTTP 方法（GET、POST、PUT、DELETE、PATCH）
- ✅ 完整透传请求头和请求体（包括文件流）
- ✅ 完整透传响应（状态码、响应头、响应体）
- ✅ 保持鉴权状态（Cookie、Session、Token）
- ✅ 支持实时上传进度
- ✅ 支持单文件和多文件上传
- ✅ 完全兼容 CrustFiles.io 原生 API

详细文档：[代理功能文档](./PROXY.md)

#### 3. 文件上传

文件上传到 Crust Network/IPFS：

```typescript
// 自动分配 CID
const cid = await crustClient.uploadFile(
  fileBuffer,
  fileName,
  fileSize
);
```

#### 2. 文件下载

通过 IPFS 网关下载文件：

```typescript
// 从 IPFS 网关下载
const ipfsGateway = `https://ipfs.io/ipfs/${cid}`;
const response = await fetch(ipfsGateway);
```

#### 3. 权限管理

支持四种权限类型：

```typescript
enum PermissionType {
  READ = 'read',      // 查看权限
  WRITE = 'write',    // 编辑权限
  DELETE = 'delete',  // 删除权限
  SHARE = 'share',    // 分享权限
}
```

#### 4. 版本控制

文件版本管理：

```typescript
// 创建新版本
addVersion(fileId, {
  id: 'version-xxx',
  version: 2,
  cid: 'Qmxxx...',
  size: fileSize,
  uploadDate: new Date().toISOString(),
});

// 恢复旧版本
restoreVersion(fileId, 1);
```

---

## 🏗️ 部署

### 方式一：使用 Coze CLI

```bash
# 构建项目
pnpm build

# 使用 Coze CLI 部署
coze deploy
```

### 方式二：Docker 部署

```bash
# 构建镜像
docker build -t crustshare .

# 运行容器
docker run -p 5000:5000 crustshare
```

### 方式三：Vercel 部署（推荐）

👉 **详细部署指南：** [Vercel 部署文档](./docs/VERCEL_DEPLOYMENT.md)

快速开始：

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. **关键步骤**：在 Project Settings → Environment Variables 中添加：
   - `PIN_CODE`（必须）- 设置你的 PIN 码
   - `CRUSTFILES_ACCESS_TOKEN`（可选）- 文件上传功能需要
   - `CRUSTFILES_BASE_URL`（可选）- 默认为 `https://crustfiles.io`
4. **重要**：添加环境变量后，必须重新部署才能生效
5. 部署完成后即可访问

**常见问题**：
- 如果登录失败，请检查环境变量 `PIN_CODE` 是否已正确配置
- 环境变量修改后需要手动重新部署（Redeploy）
- 详见 [Vercel 部署指南](./docs/VERCEL_DEPLOYMENT.md#常见问题排查)

### 环境变量

```env
# PIN 码配置（必须）
PIN_CODE=123456

# CrustFiles.io 配置（必须）
CRUSTFILES_ACCESS_TOKEN=your_crustfiles_access_token_here
CRUSTFILES_BASE_URL=https://crustfiles.io

# Upstash Redis 配置（可选，用于生产环境会话管理）
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**配置说明**：

1. **PIN 码**：必须配置。建议使用 4-6 位数字，默认为 `123456`。
2. **CrustFiles.io**：必须配置。访问 [CrustFiles.io](https://crustfiles.io/) 获取 Access Token。
3. **Upstash Redis**：用于会话管理和文件元数据持久化。如果未配置，将使用 localStorage（仅适用于开发/单用户场景）。

---

## 🔧 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript 5
- **UI 库**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **图标**: Lucide React
- **通知**: Sonner
- **存储**: Crust Network / IPFS
- **CLI**: Coze CLI

---

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🔗 相关链接

- [Crust Network](https://crust.network/)
- [IPFS](https://ipfs.io/)
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### 文档

- [API 文档](./API.md) - 完整的 API 接口文档
- [部署文档](./DEPLOYMENT.md) - 部署指南和故障排除
- [更新日志](./CHANGELOG.md) - 版本更新历史
- [贡献指南](./CONTRIBUTING.md) - 如何贡献代码
- [安全政策](./SECURITY.md) - 安全漏洞报告流程

---

## ❓ 常见问题

### 1. 如何修改密码？

使用配置生成脚本：

```bash
node scripts/generate-config.js
```

或手动生成哈希：

```bash
echo -n "new_password" | sha256sum
```

然后将哈希值更新到 `.env` 文件中的 `PASSWORD_HASH` 或 `ADMIN_PASSWORD_HASH`。

### 2. 如何配置 Upstash Redis？

1. 访问 [Upstash Console](https://console.upstash.com/)
2. 创建新的 Redis 数据库
3. 复制 REST URL 和 Token
4. 更新到 `.env` 文件：

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 3. 默认密码是什么？

- **用户密码**: `crustshare`
- **管理员密码**: `admin`

**安全提示**：生产环境请务必修改默认密码！

### 4. 文件上传失败怎么办？

检查以下几点：
1. 确认网络连接正常
2. 检查文件大小是否超过限制
3. 查看浏览器控制台错误信息
4. 确认 Crust Network 服务状态

### 5. 如何重置配置？

删除 `.env` 文件，然后重新生成：

```bash
rm .env
node scripts/generate-config.js
```

### 6. 会话过期时间是多少？

默认会话时长为 24 小时。可以在代码中修改 `sessionManager.create()` 的 TTL 参数。

### 7. 是否支持多用户？

当前版本支持单用户和管理员两种角色。多用户支持计划在未来版本中添加。

### 8. 文件存储在哪里？

文件通过 Crust Network 上传到 IPFS 分布式存储网络，具有以下特点：
- 去中心化存储
- 内容寻址（CID）
- 永久可用
- 全球分布式节点

---

## 📮 联系方式

如有问题或建议，请：

- 提交 [Issue](../../issues)
- 发送邮件至: support@crustshare.com

---

<div align="center">

Made with ❤️ by CrustShare Team

</div>
