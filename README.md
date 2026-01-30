# CrustShare

基于 Crust Network 和 IPFS 的去中心化文件存储与分享平台。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 项目介绍

CrustShare 是一个开源的去中心化文件存储和分享平台，利用 Crust Network 和 IPFS 技术，为用户提供安全、永久、无需服务器的文件存储解决方案。

### 核心特性

- **🌐 去中心化存储** - 基于 Crust Network 和 IPFS，数据分布式存储，永久保存
- **🖼️ 多媒体支持** - 支持图片预览、视频/音频在线播放
- **⚡ 智能网关** - 自动测试多个 IPFS 网关，选择最优节点加速访问
- **🔒 密码保护** - 分享链接可设置访问密码，保护隐私
- **📁 文件夹管理** - 支持创建文件夹，轻松组织文件
- **📦 批量操作** - 批量移动、复制、删除文件，提升效率
- **🔗 CID 导入** - 支持导入已有 IPFS CID 到文件库
- **📱 响应式设计** - 完美适配桌面、平板、手机等各种设备

## 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 14 | React 全栈框架 |
| [React](https://react.dev/) | 18 | UI 组件库 |
| [TypeScript](https://www.typescriptlang.org/) | 5 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 3 | 原子化 CSS |
| [shadcn/ui](https://ui.shadcn.com/) | - | UI 组件库 |
| [Zustand](https://github.com/pmndrs/zustand) | 4 | 状态管理 |
| [Framer Motion](https://www.framer.com/motion/) | 10 | 动画效果 |

### 后端服务

| 服务 | 用途 |
|------|------|
| [Upstash Redis](https://upstash.com/) | 数据持久化存储 |
| [Crust Network](https://crust.network/) | 去中心化文件存储 |
| [IPFS](https://ipfs.tech/) | 分布式文件系统 |

### 部署平台

- [Cloudflare Pages](https://pages.cloudflare.com/) - 推荐，全球 CDN 加速
- [Vercel](https://vercel.com/) - 快速部署，自动预览
- Docker - 自托管部署

## 快速开始

### 环境要求

- Node.js 20.x 或更高版本
- pnpm（推荐）或 npm

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/crustshare.git
cd crustshare
```

### 2. 安装依赖

```bash
pnpm install
# 或 npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Upstash Redis
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token

# 管理员密码（SHA256 哈希）
ADMIN_PASSWORD_HASH=your-hash

# Crust Token
CRUST_TOKEN=your-token
```

生成密码哈希：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

### 4. 启动开发服务器

```bash
pnpm dev
# 或 npm run dev
```

访问 http://localhost:3000

## 部署指南

我们提供多种部署方式，详细步骤请查看部署文档：

📖 **[查看完整部署文档 →](DEPLOY.md)**

### 快速部署到 Cloudflare Pages

1. Fork 本仓库到您的 GitHub 账号
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Pages** → **Create a project**
4. 连接 GitHub 仓库
5. 配置构建设置：
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Output directory: `dist`
6. 添加环境变量
7. 点击 **Save and Deploy**

详细步骤请参考 [DEPLOY.md](DEPLOY.md)

## 项目结构

```
crustshare/
├── app/                          # Next.js 应用目录
│   ├── dashboard/               # 文件管理页面
│   ├── share/[cid]/             # 文件分享页面
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 登录页
│   └── globals.css              # 全局样式
├── components/                   # 组件目录
│   ├── ui/                      # shadcn/ui 组件
│   ├── dashboard/               # 仪表板组件
│   ├── share/                   # 分享页面组件
│   └── modals/                  # 模态框组件
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
├── public/                       # 静态资源
├── middleware.ts                 # 中间件
├── next.config.ts                # Next.js 配置
├── package.json                  # 依赖配置
├── README.md                     # 项目说明
├── DEPLOY.md                     # 部署文档
└── LICENSE.md                    # 许可证
```

## 核心功能详解

### 文件管理

- **上传文件** - 支持拖拽上传，最大 1GB，实时进度显示
- **文件列表** - 列表/网格双视图，支持排序和筛选
- **文件搜索** - 按文件名或 CID 快速搜索
- **文件操作** - 分享、下载、重命名、移动、删除、复制 CID
- **文件预览** - 图片灯箱查看、视频/音频在线播放

### 文件夹管理

- 创建、重命名、删除文件夹
- 文件夹树形导航
- 文件拖拽到文件夹

### 批量操作

- 批量选择文件（支持 Shift 多选）
- 批量移动到文件夹
- 批量复制到文件夹
- 批量删除

### 网关管理

- 自动测试多个 IPFS 网关
- 显示网关延迟和可用性
- 智能选择最优网关
- 支持添加自定义网关
- 缓存测试结果

### 分享功能

- 生成分享链接
- 设置访问密码
- 设置过期时间
- 查看统计信息

## 开发指南

### 常用命令

```bash
# 开发模式
pnpm dev

# 构建项目
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

### 代码规范

- 使用 TypeScript 编写所有代码
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 React Hooks 最佳实践

### 提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 技术亮点

### 安全性

- ✅ SHA-256 密码哈希存储
- ✅ CORS 跨域限制
- ✅ 输入验证和消毒
- ✅ 文件类型白名单检查
- ✅ 文件名安全检查（防止路径遍历）

### 性能优化

- ⚡ 网关并发测试控制
- ⚡ 请求结果缓存
- ⚡ 图片懒加载
- ⚡ 组件按需加载
- ⚡ 状态管理优化

### 代码组织

- 🎯 自定义 Hooks 分离业务逻辑
- 🎯 统一错误处理机制
- 🎯 完整的 TypeScript 类型定义
- 🎯 模块化组件设计

## 贡献指南

我们欢迎所有形式的贡献！

### 提交 Issue

- 报告 Bug
- 提出新功能建议
- 改进文档

### 提交 Pull Request

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

## 相关资源

- 📖 [部署文档](DEPLOY.md) - 详细的部署教程
- 📄 [许可证](LICENSE.md) - MIT 许可证详情
- 🐛 [问题反馈](../../issues) - 提交 Bug 报告
- 💡 [功能建议](../../discussions) - 提出新想法

## 致谢

感谢以下开源项目：

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Crust Network](https://crust.network/) - 去中心化存储
- [IPFS](https://ipfs.tech/) - 分布式文件系统

## 许可证

本项目采用 [MIT 许可证](LICENSE.md) 开源。

```
MIT License

Copyright (c) 2024 CrustShare

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

完整许可证内容请查看 [LICENSE.md](LICENSE.md)

---

<p align="center">
  Made with ❤️ by CrustShare Team
</p>
