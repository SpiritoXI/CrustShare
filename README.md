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
- **状态**: Zustand + React Query
- **动画**: Framer Motion
- **存储**: Upstash Redis
- **部署**: Cloudflare Pages / Vercel

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 启动开发服务器
npm run dev
```

## 环境变量

```env
# Upstash Redis
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token

# 管理员密码 (SHA256)
ADMIN_PASSWORD_HASH=your-hash

# Crust Token
CRUST_TOKEN=your-token
```

## 项目结构

```
crustshare/
├── app/                    # Next.js 应用
│   ├── dashboard/         # 文件管理页面
│   │   └── page.tsx       # 仪表板页面（使用 useDashboard Hook）
│   ├── share/[cid]/       # 分享页面
│   │   ├── page.tsx       # 页面入口
│   │   └── SharePage.tsx  # 分享页面组件（使用 useSharePage Hook）
│   ├── layout.tsx
│   ├── page.tsx           # 登录页
│   └── globals.css
├── components/            # 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── dashboard/        # 仪表板组件
│   │   ├── batch-toolbar.tsx      # 批量操作工具栏
│   │   ├── upload-progress.tsx    # 上传进度条
│   │   ├── dashboard-header.tsx   # 仪表板头部
│   │   ├── preview-modal.tsx      # 预览模态框
│   │   └── index.ts               # 统一导出
│   ├── share/            # 分享页面组件
│   │   ├── password-gate.tsx
│   │   ├── file-info-card.tsx
│   │   ├── gateway-selector.tsx
│   │   ├── download-section.tsx
│   │   ├── ipfs-info-card.tsx
│   │   ├── share-header.tsx
│   │   └── share-footer.tsx
│   ├── modals/           # 模态框组件
│   │   ├── share-modal.tsx
│   │   ├── gateway-modal.tsx
│   │   ├── folder-modal.tsx
│   │   ├── move-modal.tsx
│   │   ├── add-cid-modal.tsx
│   │   ├── settings-modal.tsx
│   │   ├── download-modal.tsx
│   │   ├── add-gateway-modal.tsx
│   │   └── rename-file-modal.tsx
│   ├── image-viewer.tsx  # 图片查看器
│   ├── media-player.tsx  # 媒体播放器
│   ├── sidebar.tsx       # 侧边栏导航
│   ├── file-list.tsx     # 文件列表
│   └── modal.tsx         # 通用模态框
├── hooks/                # 自定义 Hooks
│   ├── use-dashboard.ts  # 仪表板页面逻辑
│   └── use-share-page.ts # 分享页面逻辑
├── lib/                  # 工具库
│   ├── api.ts           # API 服务
│   ├── config.ts        # 配置
│   ├── store.ts         # 状态管理
│   └── utils.ts         # 工具函数
├── functions/api/        # Cloudflare Functions
│   ├── db_proxy.ts      # 数据库代理
│   ├── get_token.ts     # 获取上传令牌
│   └── verify-password.ts # 密码验证
├── types/               # TypeScript 类型
└── middleware.ts        # 中间件
```

## 核心功能

### 仪表板 (Dashboard)

#### 文件管理
- 文件上传（支持拖拽，最大 1GB）
- 文件列表（列表/网格视图）
- 文件搜索（按名称或 CID）
- 文件操作：
  - 分享（生成分享链接）
  - 下载（智能选择最优网关）
  - 重命名
  - 移动到其他文件夹
  - 删除
  - 复制 CID
  - 预览（图片/视频/音频）

#### 文件夹管理
- 创建文件夹
- 重命名文件夹
- 删除文件夹
- 文件夹导航

#### 批量操作
- 批量选择文件
- 批量移动到文件夹
- 批量复制到文件夹
- 批量删除

#### CID 导入
- 手动输入 CID
- 自动检测文件名和大小
- 选择目标文件夹

#### 网关管理
- 多网关测速
- 自动选择最优网关
- 添加自定义网关
- 公共网关列表获取

#### 设置
- 深色/浅色模式切换
- 每页显示文件数
- 自动刷新开关

### 分享页面 (SharePage)

#### 访问控制
- 密码保护访问
- 密码验证界面

#### 文件展示
- 文件信息展示（名称、大小、过期时间）
- 图片预览 + 灯箱查看
- 视频/音频在线播放

#### 下载功能
- 智能网关选择
- 多网关测速
- 指定网关下载
- 下载进度显示

#### IPFS 集成
- IPFS 直接访问链接
- CID 复制
- 网关选择器

### 媒体播放器 (MediaPlayer)

- 视频/音频播放
- 多网关自动切换
- 播放控制（播放/暂停/进度/音量）
- 全屏支持
- 播放速度调节

### 图片查看器 (ImageViewer)

- 缩略图预览
- 灯箱全屏查看
- 多网关自动切换
- 缩放/旋转（灯箱模式）

## 自定义 Hooks

### useDashboard

管理仪表板页面的所有状态和逻辑：

```typescript
const {
  // UI State
  searchQuery, setSearchQuery,
  viewMode, setViewMode,
  isLoading, dragOver, copiedId,
  currentFolderId, setCurrentFolderId,
  selectedFiles,

  // Data
  files, folders, totalSize,
  gateways, customGateways,

  // Upload
  isUploading, uploadProgress,

  // Modal States
  shareModalOpen, setShareModalOpen,
  gatewayModalOpen, setGatewayModalOpen,
  // ... 更多状态

  // Handlers
  handleFileUpload,
  handleDelete,
  handleCopyCID,
  handleShare,
  // ... 更多处理器
} = useDashboard();
```

### useSharePage

管理分享页面的所有状态和逻辑：

```typescript
const {
  shareInfo,
  gateways,
  isTestingGateways,
  selectedGateway,
  isAuthenticated,
  isLoading,
  downloadProgress,
  isDownloading,
  copiedCid,
  isSmartSelecting,
  gatewayTestStatus,
  setSelectedGateway,
  testGateways,
  handleVerifyPassword,
  handleCopyCid,
  handleDownload,
  handleSmartDownload,
  handleOpenInIpfs,
} = useSharePage(cid);
```

## 状态管理

使用 Zustand 进行状态管理，分为多个 Store：

- **AuthStore** - 认证状态（登录、CSRF Token、锁定）
- **FileStore** - 文件和文件夹数据
- **GatewayStore** - 网关配置和状态
- **UploadStore** - 上传状态和进度
- **UIStore** - UI 状态（Toast、模态框）

## 部署

### Cloudflare Pages

1. 连接 GitHub 仓库
2. 构建设置：
   - Framework: Next.js
   - Build command: `npm run build`
   - Output: `dist`
3. 添加环境变量
4. 部署

### Vercel

1. 导入 GitHub 仓库
2. 配置环境变量
3. 部署

## 开发

```bash
npm run dev      # 开发模式
npm run build    # 构建
npm run lint     # 代码检查
```

## 许可证

MIT
