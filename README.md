# CrustShare

<p align="center">
  <img src="./public/icon-192x192.png" alt="CrustShare Logo" width="120">
</p>

<p align="center">
  基于 Crust Network 和 IPFS 的去中心化文件存储与分享平台
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript">
  </a>
  <a href="https://tailwindcss.com/">
    <img src="https://img.shields.io/badge/Tailwind-3-38B2AC" alt="Tailwind CSS">
  </a>
</p>

---

## 目录

- [项目介绍](#项目介绍)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [配置说明](#配置说明)
- [部署指南](#部署指南)
- [开发文档](#开发文档)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目介绍

**CrustShare** 是一个开源的去中心化文件存储和分享平台，利用 [Crust Network](https://crust.network/) 和 [IPFS](https://ipfs.tech/) 技术，为用户提供安全、永久、无需服务器的文件存储解决方案。

### 为什么选择 CrustShare？

- **永久存储** - 基于 IPFS 的内容寻址和 Crust Network 的激励机制，确保文件长期可用
- **去中心化** - 无单点故障，数据分布式存储在全球节点
- **隐私保护** - 端到端加密，支持密码保护分享链接
- **开源免费** - 完全开源，可自托管，无平台锁定

---

## 核心特性

### 文件管理
- 📁 **文件夹管理** - 创建、重命名、删除文件夹，支持嵌套结构
- 🔍 **智能搜索** - 快速搜索文件和文件夹
- 📊 **批量操作** - 批量移动、复制、删除文件
- 🏷️ **文件排序** - 按名称、大小、日期排序

### 文件上传
- 📤 **拖拽上传** - 支持拖拽文件到浏览器上传
- 📈 **进度显示** - 实时显示上传进度
- 🔒 **安全检查** - 文件名安全验证、类型检查
- ⚡ **故障转移** - 多节点上传，自动切换可用节点

### 文件预览
- 🖼️ **图片预览** - 支持 JPG、PNG、GIF、WebP、SVG 等格式
- 📄 **文件信息** - 显示 CID、大小、上传时间等元数据

### 分享功能
- 🔗 **链接分享** - 生成可分享的链接
- 🔐 **密码保护** - 为分享链接设置访问密码
- ⏰ **过期设置** - 设置分享链接的有效期
- 🌐 **多网关** - 智能选择最优 IPFS 网关

### 网关管理
- 🚀 **智能检测** - 自动测试网关可用性和延迟
- 🌍 **全球节点** - 支持 40+ 个 IPFS 公共网关
- ⭐ **优质保存** - 自动保存连通性好的网关优先使用
- 📊 **健康评分** - 基于延迟和成功率的健康度评估

---

## 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 14 | React 全栈框架，App Router |
| [React](https://react.dev/) | 18 | UI 组件库 |
| [TypeScript](https://www.typescriptlang.org/) | 5 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 3 | 原子化 CSS |
| [shadcn/ui](https://ui.shadcn.com/) | - | 基础 UI 组件 |
| [Zustand](https://github.com/pmndrs/zustand) | 4 | 状态管理 |
| [TanStack Query](https://tanstack.com/query) | 5 | 服务端状态管理 |
| [Framer Motion](https://www.framer.com/motion/) | 11 | 动画效果 |

### 后端服务

| 服务 | 用途 |
|------|------|
| [Upstash Redis](https://upstash.com/) | 数据持久化存储（文件元数据、分享配置） |
| [Crust Network](https://crust.network/) | 去中心化文件存储 |
| [IPFS](https://ipfs.tech/) | 分布式文件系统 |

### 部署平台

- **[Cloudflare Pages](https://pages.cloudflare.com/)** - 推荐，全球 CDN 加速 + 边缘函数
- **[Vercel](https://vercel.com/)** - 快速部署，自动预览
- **Docker** - 自托管部署

---

## 快速开始

### 环境要求

- **Node.js** >= 20.x
- **pnpm** >= 8.x（推荐）或 npm >= 10.x

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/crustshare.git
cd crustshare
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入以下必需配置：

```env
# Upstash Redis（必需）
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token

# 管理员密码 SHA256 哈希（必需）
ADMIN_PASSWORD_HASH=your-hash

# Crust Token（必需）
CRUST_TOKEN=your-token
```

生成密码哈希：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

---

## 项目结构

```
crustshare/
├── app/                          # Next.js App Router
│   ├── dashboard/               # 文件管理页面
│   ├── share/[cid]/             # 文件分享页面
│   ├── download/[cid]/          # 文件下载页面
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 登录页
│   └── providers.tsx            # 全局 Provider
├── components/                   # React 组件
│   ├── ui/                      # shadcn/ui 基础组件
│   ├── dashboard/               # 仪表板组件
│   ├── share/                   # 分享页面组件
│   └── modals/                  # 模态框组件
├── hooks/                        # 自定义 React Hooks
│   ├── use-upload.ts            # 文件上传
│   ├── use-file-operations.ts   # 文件操作
│   ├── use-folder-operations.ts # 文件夹操作
│   ├── use-gateway.ts           # 网关管理
│   └── use-share-page.ts        # 分享页面
├── lib/                          # 工具库
│   ├── api.ts                   # API 服务
│   ├── config.ts                # 配置常量
│   ├── store.ts                 # Zustand 状态管理
│   ├── security.ts              # 安全工具
│   ├── utils.ts                 # 通用工具函数
│   ├── file-utils.ts            # 文件相关工具
│   ├── cid-utils.ts             # CID 处理工具
│   └── password-utils.ts        # 密码处理工具
├── types/                        # TypeScript 类型定义
│   └── index.ts
├── functions/api/                # Cloudflare Functions
├── scripts/                      # 脚本工具
├── public/                       # 静态资源
├── middleware.ts                 # Next.js 中间件
├── next.config.js                # Next.js 配置
└── package.json
```

---

## 配置说明

### 必需环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `UPSTASH_URL` | Upstash Redis URL | [Upstash 控制台](https://console.upstash.com/) |
| `UPSTASH_TOKEN` | Upstash REST API Token | [Upstash 控制台](https://console.upstash.com/) |
| `ADMIN_PASSWORD_HASH` | 管理员密码 SHA256 哈希 | `node -e "console.log(require('crypto').createHash('sha256').update('密码').digest('hex'))"` |
| `CRUST_TOKEN` | Crust Network API Token | [Crust Cloud](https://crustcloud.io/) |

### 可选环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DEFAULT_PAGE_SIZE` | 20 | 每页显示文件数 |
| `MAX_UPLOAD_SIZE` | 1073741824 (1GB) | 上传文件大小限制（字节） |
| `DEFAULT_SHARE_EXPIRY_DAYS` | 7 | 分享链接默认过期天数 |

---

## 部署指南

详细部署文档请查看 [DEPLOY.md](./DEPLOY.md)

### Cloudflare Pages 快速部署

1. Fork 本仓库到 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Pages** → **Create a project**
4. 连接 GitHub 仓库
5. 配置构建设置：
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Output directory: `dist`
6. 添加环境变量
7. 点击 **Save and Deploy**

---

## 开发文档

### 代码规范

- 使用 **TypeScript** 严格模式
- 组件使用函数式组件 + Hooks
- 状态管理使用 **Zustand**
- 样式使用 **Tailwind CSS**
- 图标使用 **Lucide React**

### 目录组织原则

```
├── 组件按功能分组（dashboard/、share/、modals/）
├── Hooks 按业务逻辑拆分
├── lib/ 按功能模块化（api、config、utils、security）
├── 类型定义集中在 types/
├── API 路由在 functions/api/
```

### 命名规范

- 组件：PascalCase（如 `FileList.tsx`）
- Hooks：camelCase 前缀 use（如 `useUpload.ts`）
- 工具函数：camelCase（如 `formatFileSize.ts`）
- 常量：UPPER_SNAKE_CASE（如 `API_ENDPOINTS`）
- 类型：PascalCase 后缀 Type（如 `FileRecord`）

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构（既不是新功能也不是修复）
perf: 性能优化
test: 测试相关
chore: 构建过程或辅助工具的变动
```

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

---

## 许可证

[MIT License](./LICENSE.md)

---

## 致谢

- [Crust Network](https://crust.network/) - 去中心化存储网络
- [IPFS](https://ipfs.tech/) - 星际文件系统
- [Upstash](https://upstash.com/) - Serverless Redis
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 UI 组件

---

<p align="center">
  Made with ❤️ by CrustShare Team
</p>
