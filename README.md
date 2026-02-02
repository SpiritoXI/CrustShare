# CrustShare

基于 Crust Network 和 IPFS 的去中心化文件存储与分享平台。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 项目介绍

CrustShare 是一个开源的去中心化文件存储和分享平台，利用 Crust Network 和 IPFS 技术，为用户提供安全、永久、无需服务器的文件存储解决方案。

### 核心特性

- **去中心化存储** - 基于 Crust Network 和 IPFS，数据分布式存储，永久保存
- **多媒体支持** - 支持图片预览、视频/音频在线播放
- **智能网关** - 自动测试多个 IPFS 网关，选择最优节点加速访问
- **密码保护** - 分享链接可设置访问密码，保护隐私
- **文件夹管理** - 支持创建文件夹，轻松组织文件
- **批量操作** - 批量移动、复制、删除文件，提升效率
- **CID 导入** - 支持导入已有 IPFS CID 到文件库
- **响应式设计** - 完美适配桌面、平板、手机等各种设备

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

## 目录结构

```
crustshare/
├── app/                          # Next.js 应用目录
│   ├── dashboard/               # 文件管理页面
│   │   └── page.tsx             # 仪表板主页面
│   ├── share/[cid]/             # 文件分享页面
│   │   ├── page.tsx             # 分享页面入口
│   │   └── SharePage.tsx        # 分享页面组件
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 登录页
│   ├── providers.tsx            # 全局 Provider
│   └── globals.css              # 全局样式
├── components/                   # 组件目录
│   ├── ui/                      # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   └── slider.tsx
│   ├── dashboard/               # 仪表板组件
│   │   ├── batch-toolbar.tsx    # 批量操作工具栏
│   │   ├── dashboard-header.tsx # 仪表板头部
│   │   ├── index.ts             # 统一导出
│   │   ├── preview-modal.tsx    # 文件预览弹窗
│   │   └── upload-progress.tsx  # 上传进度组件
│   ├── share/                   # 分享页面组件
│   │   ├── download-section.tsx # 下载区域
│   │   ├── file-info-card.tsx   # 文件信息卡片
│   │   ├── gateway-selector.tsx # 网关选择器
│   │   ├── ipfs-info-card.tsx   # IPFS 信息卡片
│   │   ├── password-gate.tsx    # 密码验证
│   │   ├── share-footer.tsx     # 分享页脚
│   │   └── share-header.tsx     # 分享头部
│   ├── modals/                  # 模态框组件
│   │   ├── add-cid-modal.tsx    # 添加 CID
│   │   ├── add-gateway-modal.tsx# 添加网关
│   │   ├── download-modal.tsx   # 下载选项
│   │   ├── folder-modal.tsx     # 文件夹管理
│   │   ├── gateway-modal.tsx    # 网关管理
│   │   ├── move-modal.tsx       # 移动文件
│   │   ├── rename-file-modal.tsx# 重命名文件
│   │   ├── settings-modal.tsx   # 设置
│   │   └── share-modal.tsx      # 分享配置
│   ├── file-list.tsx            # 文件列表组件
│   ├── image-viewer.tsx         # 图片查看器
│   ├── media-player.tsx         # 媒体播放器
│   ├── modal.tsx                # 通用模态框
│   ├── sidebar.tsx              # 侧边栏
│   └── toast.tsx                # 消息提示
├── hooks/                        # 自定义 Hooks
│   ├── index.ts                 # 统一导出
│   ├── use-dashboard.ts         # 仪表板逻辑
│   ├── use-file-operations.ts   # 文件操作
│   ├── use-folder-operations.ts # 文件夹操作
│   ├── use-gateway.ts           # 网关管理
│   ├── use-share-page.ts        # 分享页逻辑
│   └── use-upload.ts            # 文件上传
├── lib/                          # 工具库
│   ├── api.ts                   # API 服务
│   ├── config.ts                # 配置常量
│   ├── error-handler.ts         # 错误处理
│   ├── security.ts              # 安全工具
│   ├── store.ts                 # 状态管理
│   └── utils.ts                 # 工具函数
├── functions/api/                # Cloudflare Functions
│   ├── db_proxy.ts              # 数据库代理
│   ├── get_token.ts             # 获取上传令牌
│   ├── share.ts                 # 分享接口
│   ├── verify-password.ts       # 密码验证
│   └── verify-share-password.ts # 分享密码验证
├── types/                        # TypeScript 类型
│   ├── env.d.ts                 # 环境变量类型
│   └── index.ts                 # 类型定义
├── public/                       # 静态资源
│   └── icons/                   # 图标资源
├── scripts/                      # 脚本工具
│   ├── compress-image.js        # 图片压缩
│   ├── generate-env.js          # 环境变量生成
│   └── generate-icons.js        # 图标生成
├── middleware.ts                 # 中间件
├── next.config.js                # Next.js 配置
├── package.json                  # 依赖配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
├── README.md                     # 项目说明
├── DEPLOY.md                     # 部署文档
└── LICENSE.md                    # 许可证
```

## 核心功能实现

### 1. 文件上传

文件上传通过 `use-upload.ts` Hook 实现，支持：

- 拖拽上传
- 进度显示
- 文件大小限制（默认 1GB）
- 文件类型验证
- 文件名安全检查

**关键接口：**

```typescript
// hooks/use-upload.ts
export function useUpload() {
  const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<{ cid: string; hash: string; size: number }>;
}
```

### 2. 文件管理

文件管理通过 `use-file-operations.ts` Hook 实现，支持：

- 文件列表展示（列表/网格视图）
- 文件搜索
- 文件排序
- 批量操作（移动、删除）
- 文件重命名

**关键接口：**

```typescript
// hooks/use-file-operations.ts
export interface FileOperations {
  files: FileRecord[];
  selectedFiles: string[];
  handleDelete: (fileId: string) => Promise<void>;
  handleMove: (fileIds: string[], folderId: string) => Promise<void>;
  handleRename: (fileId: string, newName: string) => Promise<void>;
  toggleSelection: (fileId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}
```

### 3. 文件夹管理

文件夹管理通过 `use-folder-operations.ts` Hook 实现，支持：

- 创建文件夹
- 重命名文件夹
- 删除文件夹
- 文件夹树形导航

**关键接口：**

```typescript
// hooks/use-folder-operations.ts
export interface FolderOperations {
  folders: Folder[];
  currentFolderId: string | null;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  setCurrentFolder: (folderId: string | null) => void;
}
```

### 4. 网关管理

网关管理通过 `use-gateway.ts` Hook 实现，支持：

- 自动测试网关可用性
- 延迟检测
- 智能选择最优网关
- 自定义网关添加

**关键接口：**

```typescript
// hooks/use-gateway.ts
export interface GatewayOperations {
  gateways: Gateway[];
  testGateways: () => Promise<void>;
  getBestGateway: () => Gateway | null;
  addCustomGateway: (gateway: Gateway) => void;
  removeCustomGateway: (name: string) => void;
}
```

### 5. 文件分享

文件分享通过 `use-share-page.ts` Hook 实现，支持：

- 生成分享链接
- 密码保护
- 过期时间设置
- 多网关下载

**关键接口：**

```typescript
// hooks/use-share-page.ts
export function useSharePage(cid: string) {
  shareInfo: ShareInfo | null;
  gateways: Gateway[];
  selectedGateway: Gateway | null;
  handleDownload: () => void;
  handleVerifyPassword: (password: string) => Promise<boolean>;
  testGateways: () => Promise<void>;
}
```

### 6. API 服务

API 服务封装在 `lib/api.ts` 中，提供：

```typescript
// lib/api.ts
export const api = {
  getToken: () => Promise<string>;
  loadFiles: () => Promise<FileRecord[]>;
  saveFile: (file: FileRecord) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFiles: (fileIds: string[], folderId: string) => Promise<void>;
  loadFolders: () => Promise<Folder[]>;
  createFolder: (folder: Folder) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  validateCid: (cid: string) => { valid: boolean; error?: string };
  fetchCidInfo: (cid: string) => Promise<CidInfo | null>;
};

export const uploadApi = {
  uploadToCrust: (
    file: File,
    token: string,
    onProgress: (progress: number) => void
  ) => Promise<{ cid: string; hash: string; size: number }>;
  verifyFile: (cid: string) => Promise<VerifyResult>;
};

export const gatewayApi = {
  testGateway: (url: string) => Promise<TestResult>;
  testAllGateways: (gateways: Gateway[]) => Promise<Gateway[]>;
  fetchPublicGateways: () => Promise<Gateway[]>;
  getCachedResults: () => Gateway[] | null;
  cacheResults: (gateways: Gateway[]) => void;
};

export const shareApi = {
  createShare: (config: ShareConfig) => Promise<ShareInfo>;
  getShareInfo: (cid: string) => Promise<ShareInfo | null>;
  verifyPassword: (cid: string, password: string) => Promise<ShareInfo | null>;
};
```

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

详细部署文档请查看 [DEPLOY.md](./DEPLOY.md)

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

## 许可证

[MIT License](./LICENSE.md)
