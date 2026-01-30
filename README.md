# CrustShare

基于 Crust Network 和 IPFS 的去中心化文件存储与分享平台。

## 特性

- **去中心化存储** - 基于 Crust Network 和 IPFS，数据永久保存
- **多媒体支持** - 图片预览、视频/音频在线播放
- **智能网关** - 多网关测速，自动选择最优节点
- **密码保护** - 分享链接可设置访问密码
- **文件夹管理** - 支持创建文件夹，组织文件
- **批量操作** - 批量移动、复制、删除文件
- **CID 导入** - 支持导入已有 CID 到文件库
- **响应式设计** - 完美适配桌面、平板、手机

## 技术栈

- **框架**: Next.js 14 + React 18 + TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **状态**: Zustand
- **动画**: Framer Motion
- **存储**: Upstash Redis
- **部署**: Cloudflare Pages / Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/crustshare.git
cd crustshare
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# Upstash Redis - 用于数据存储
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token

# 管理员密码 (SHA256 哈希)
ADMIN_PASSWORD_HASH=your-hash

# Crust Token - 用于文件上传
CRUST_TOKEN=your-token
```

生成密码哈希：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## Cloudflare Pages 部署教程

### 方式一：通过 Git 集成部署（推荐）

#### 1. 准备代码仓库

确保你的代码已推送到 GitHub/GitLab 仓库：

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. 创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单 **Pages**
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权并选择你的 GitHub/GitLab 账号
6. 选择 `crustshare` 仓库
7. 点击 **Begin setup**

#### 3. 配置构建设置

在构建设置页面填写：

| 配置项 | 值 |
|--------|-----|
| **Project name** | crustshare（或自定义） |
| **Production branch** | main |
| **Framework preset** | Next.js |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

#### 4. 配置环境变量

在 **Environment variables** 部分添加：

```
NODE_VERSION = 20
UPSTASH_URL = https://your-url.upstash.io
UPSTASH_TOKEN = your-token
ADMIN_PASSWORD_HASH = your-hash
CRUST_TOKEN = your-token
```

#### 5. 保存并部署

点击 **Save and Deploy**

等待构建完成，Cloudflare 会自动分配一个 `*.pages.dev` 域名。

### 方式二：通过 Wrangler CLI 部署

#### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开授权页面，点击允许。

#### 3. 配置 wrangler.toml

创建 `wrangler.toml` 文件：

```toml
name = "crustshare"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build"

[site]
bucket = "./dist"

# 环境变量（生产环境）
[env.production.vars]
NODE_ENV = "production"

# 密钥（需要单独设置）
[[env.production.kv_namespaces]]
binding = "UPSTASH"
id = "your-kv-namespace-id"
```

#### 4. 设置 Secrets

```bash
# 设置 Upstash URL
wrangler secret put UPSTASH_URL

# 设置 Upstash Token
wrangler secret put UPSTASH_TOKEN

# 设置管理员密码哈希
wrangler secret put ADMIN_PASSWORD_HASH

# 设置 Crust Token
wrangler secret put CRUST_TOKEN
```

输入命令后，在提示符处粘贴对应的值。

#### 5. 部署

```bash
# 部署到预览环境
wrangler deploy

# 部署到生产环境
wrangler deploy --env production
```

### 方式三：直接上传构建产物

#### 1. 本地构建

```bash
npm run build
```

#### 2. 使用 Wrangler 上传

```bash
wrangler pages deploy dist --project-name=crustshare
```

### 部署后配置

#### 自定义域名

1. 在 Cloudflare Pages 项目页面，点击 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `share.yourdomain.com`）
4. 按照提示添加 DNS 记录
5. 等待 SSL 证书自动配置

#### 环境变量更新

如需更新环境变量：

1. 进入项目页面
2. 点击 **Settings** → **Environment variables**
3. 添加/修改变量
4. 重新部署

### 故障排查

#### 构建失败

检查构建日志，常见问题：

- **Node 版本问题**: 确保设置 `NODE_VERSION=20`
- **依赖安装失败**: 检查 `package.json` 和 lock 文件
- **内存不足**: 大型项目可能需要增加构建内存

#### 运行时错误

- **Redis 连接失败**: 检查 `UPSTASH_URL` 和 `UPSTASH_TOKEN`
- **上传失败**: 检查 `CRUST_TOKEN` 是否有效
- **密码验证失败**: 检查 `ADMIN_PASSWORD_HASH` 是否正确

#### 查看日志

```bash
wrangler pages deployment tail --project-name=crustshare
```

---

## Vercel 部署

### 1. 导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New...** → **Project**
3. 导入 GitHub 仓库

### 2. 配置项目

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3. 添加环境变量

添加与 Cloudflare 相同的环境变量。

### 4. 部署

点击 **Deploy**，等待构建完成。

---

## 项目结构

```
crustshare/
├── app/                          # Next.js 应用目录
│   ├── dashboard/               # 文件管理页面
│   │   └── page.tsx             # 仪表板页面
│   ├── share/[cid]/             # 分享页面
│   │   ├── page.tsx             # 页面入口
│   │   └── SharePage.tsx        # 分享页面组件
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 登录页
│   └── globals.css              # 全局样式
├── components/                   # 组件目录
│   ├── ui/                      # shadcn/ui 组件
│   ├── dashboard/               # 仪表板组件
│   │   ├── batch-toolbar.tsx    # 批量操作工具栏
│   │   ├── upload-progress.tsx  # 上传进度条
│   │   ├── dashboard-header.tsx # 仪表板头部
│   │   └── preview-modal.tsx    # 预览模态框
│   ├── share/                   # 分享页面组件
│   │   ├── password-gate.tsx    # 密码验证
│   │   ├── file-info-card.tsx   # 文件信息
│   │   ├── gateway-selector.tsx # 网关选择器
│   │   └── download-section.tsx # 下载区域
│   ├── modals/                  # 模态框组件
│   │   ├── share-modal.tsx      # 分享模态框
│   │   ├── gateway-modal.tsx    # 网关管理
│   │   ├── folder-modal.tsx     # 文件夹管理
│   │   └── settings-modal.tsx   # 设置
│   ├── image-viewer.tsx         # 图片查看器
│   ├── media-player.tsx         # 媒体播放器
│   ├── sidebar.tsx              # 侧边栏
│   └── file-list.tsx            # 文件列表
├── hooks/                        # 自定义 Hooks
│   ├── use-dashboard.ts         # 仪表板逻辑
│   ├── use-share-page.ts        # 分享页逻辑
│   ├── use-file-operations.ts   # 文件操作
│   ├── use-folder-operations.ts # 文件夹操作
│   ├── use-upload.ts            # 文件上传
│   └── use-gateway.ts           # 网关管理
├── lib/                          # 工具库
│   ├── api.ts                   # API 服务
│   ├── config.ts                # 配置
│   ├── store.ts                 # 状态管理
│   ├── utils.ts                 # 工具函数
│   ├── security.ts              # 安全工具
│   └── error-handler.ts         # 错误处理
├── functions/api/                # Cloudflare Functions
│   ├── db_proxy.ts              # 数据库代理
│   ├── get_token.ts             # 获取上传令牌
│   └── verify-password.ts       # 密码验证
├── types/                        # TypeScript 类型
│   └── index.ts                 # 类型定义
├── middleware.ts                 # 中间件
├── next.config.ts                # Next.js 配置
└── package.json                  # 依赖配置
```

---

## 核心功能

### 仪表板 (Dashboard)

#### 文件管理
- 文件上传（支持拖拽，最大 1GB）
- 文件列表（列表/网格视图）
- 文件搜索（按名称或 CID）
- 文件操作：分享、下载、重命名、移动、删除、复制 CID、预览

#### 文件夹管理
- 创建、重命名、删除文件夹
- 文件夹导航

#### 批量操作
- 批量选择、移动、复制、删除

#### CID 导入
- 手动输入 CID
- 自动检测文件名和大小

#### 网关管理
- 多网关测速
- 自动选择最优网关
- 添加自定义网关

### 分享页面 (SharePage)

- 密码保护访问
- 图片预览 + 灯箱
- 视频/音频在线播放
- 智能网关下载

---

## 开发命令

```bash
npm run dev          # 开发模式
npm run build        # 构建
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查
```

---

## 技术亮点

### 安全性
- SHA-256 密码哈希
- CORS 限制
- 输入验证和消毒
- 文件类型检查

### 性能优化
- 网关并发控制
- 请求缓存
- 图片懒加载
- 组件懒加载

### 代码组织
- 自定义 Hooks 分离业务逻辑
- 统一错误处理
- 类型安全

---

## 许可证

MIT License

Copyright (c) 2024 CrustShare

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
