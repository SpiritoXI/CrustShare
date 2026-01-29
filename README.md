# CrustShare

基于 Crust Network 和 IPFS 的去中心化文件存储与分享平台。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)](https://tailwindcss.com/)

## 特性

- **去中心化存储** - 基于 Crust Network 和 IPFS
- **安全登录** - SHA-256 加密 + 暴力破解防护
- **文件管理** - 拖拽上传、文件夹管理、批量操作
- **智能网关** - 多网关测速，自动选择最优节点
- **Glassmorphism UI** - 现代化毛玻璃设计风格
- **响应式布局** - 完美适配桌面、平板、手机

## 技术栈

- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **状态**: Zustand
- **数据**: React Query
- **存储**: Upstash Redis
- **部署**: Cloudflare Pages / Vercel

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/crustshare.git
cd crustshare

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 环境变量

```env
# Upstash Redis
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token

# 管理员密码
ADMIN_PASSWORD=your-password
ADMIN_PASSWORD_HASH=sha256-hash

# Crust Token
CRUST_TOKEN=your-crust-token
```

## 部署

支持 Cloudflare Pages 和 Vercel 部署。

详细步骤请参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 项目结构

```
crustshare/
├── app/                 # Next.js 应用
│   ├── api/            # API 路由
│   ├── dashboard/      # 文件管理页面
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 登录页面
│   └── providers.tsx   # 全局 Provider
├── components/         # 组件
│   ├── ui/            # UI 组件
│   └── toast.tsx      # Toast 通知
├── lib/               # 工具库
│   ├── api.ts         # API 服务
│   ├── config.ts      # 配置
│   ├── store.ts       # 状态管理
│   └── utils.ts       # 工具函数
├── types/             # TypeScript 类型
└── middleware.ts      # 中间件
```

## 功能截图

（待添加）

## 贡献

欢迎提交 Issue 和 Pull Request！

请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 许可证

MIT License

## 致谢

- [Crust Network](https://crust.network/)
- [IPFS](https://ipfs.tech/)
- [Upstash](https://upstash.com/)
- [shadcn/ui](https://ui.shadcn.com/)
