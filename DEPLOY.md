# CrustShare 详细部署教程

本文档提供 CrustShare 项目的完整部署指南，包括环境准备、配置说明和三种部署方式。

---

## 目录

1. [环境准备](#环境准备)
2. [获取必要服务](#获取必要服务)
3. [本地开发环境配置](#本地开发环境配置)
4. [Cloudflare Pages 部署](#cloudflare-pages-部署)
5. [Vercel 部署](#vercel-部署)
6. [Docker 部署](#docker-部署)
7. [常见问题排查](#常见问题排查)

---

## 环境准备

### 系统要求

- **Node.js**: 20.x 或更高版本
- **包管理器**: pnpm (推荐) 或 npm
- **Git**: 用于版本控制

### 安装 Node.js

**Windows:**
```powershell
# 使用 nvm-windows
nvm install 20
nvm use 20

# 验证安装
node -v  # 应显示 v20.x.x
```

**macOS/Linux:**
```bash
# 使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 验证安装
node -v
```

### 安装 pnpm（推荐）

```bash
npm install -g pnpm
```

---

## 获取必要服务

部署 CrustShare 需要以下服务：

### 1. Upstash Redis（必需）

用于存储文件元数据、文件夹信息和分享配置。

**注册步骤：**

1. 访问 [Upstash](https://upstash.com/)
2. 点击 **Sign Up**，使用 GitHub 账号登录
3. 进入控制台，点击 **Create Database**
4. 选择 **Redis**
5. 配置数据库：
   - **Database Name**: `crustshare`（或自定义）
   - **Region**: 选择离你最近的区域（如 `ap-southeast-1` 新加坡）
   - **Type**: 选择 **Free**（免费版足够）
6. 点击 **Create**
7. 创建完成后，进入数据库详情页
8. 复制以下信息：
   - **UPSTASH_URL**: `https://your-url.upstash.io`
   - **UPSTASH_TOKEN**: 点击 **REST API** 标签页，复制 token

### 2. Crust Network Token（必需）

用于将文件上传到 Crust Network。

**获取步骤：**

1. 访问 [Crust Cloud](https://crustcloud.io/)
2. 注册并登录账号
3. 进入 **API Tokens** 页面
4. 点击 **Create Token**
5. 复制生成的 Token

**注意：** Crust 提供一定的免费存储额度，超出后需要充值。

### 3. Cloudflare 账号（推荐）

用于部署到 Cloudflare Pages。

**注册步骤：**

1. 访问 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 使用邮箱注册账号
3. 验证邮箱
4. 登录控制台

---

## 本地开发环境配置

### 1. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/yourusername/crustshare.git
cd crustshare

# 或者下载 ZIP 解压后进入目录
cd crustshare-main
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 3. 生成管理员密码哈希

```bash
# 使用 Node.js 生成 SHA-256 哈希
node -e "console.log(require('crypto').createHash('sha256').update('你的密码').digest('hex'))"

# 示例：密码为 "admin123"
node -e "console.log(require('crypto').createHash('sha256').update('admin123').digest('hex'))"
# 输出：0192023a7bbd73250516f069df18b500...
```

**保存好生成的哈希值**，稍后需要用到。

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# ============================================
# Upstash Redis 配置（必需）
# ============================================
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-upstash-token

# ============================================
# 管理员密码（SHA256 哈希，必需）
# ============================================
ADMIN_PASSWORD_HASH=your-password-hash

# ============================================
# Crust Token（必需）
# ============================================
CRUST_TOKEN=your-crust-token

# ============================================
# 可选配置
# ============================================
# 默认每页显示文件数
DEFAULT_PAGE_SIZE=20

# 上传文件大小限制（字节）
MAX_UPLOAD_SIZE=1073741824

# 分享链接默认过期天数
DEFAULT_SHARE_EXPIRY_DAYS=7
```

### 5. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

访问 http://localhost:3000

使用管理员密码登录，开始测试。

---

## Cloudflare Pages 部署

### 方式一：Git 集成部署（推荐用于生产环境）

#### 步骤 1：准备 Git 仓库

如果你还没有将代码推送到 GitHub：

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/crustshare.git

# 推送到 main 分支
git push -u origin main
```

#### 步骤 2：创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在左侧菜单点击 **Pages**
3. 点击 **Create a project** 按钮
4. 选择 **Connect to Git**
5. 授权 Cloudflare 访问你的 GitHub/GitLab 账号
6. 在仓库列表中找到 `crustshare`，点击 **Select**
7. 点击 **Begin setup**

#### 步骤 3：配置构建设置

在 **Set up builds and deployments** 页面填写：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Project name** | `crustshare` | 项目名称，会影响默认域名 |
| **Production branch** | `main` | 生产环境分支 |
| **Framework preset** | `Next.js` | 框架预设 |
| **Build command** | `npm run build` | 构建命令 |
| **Build output directory** | `dist` | 构建输出目录 |

#### 步骤 4：配置环境变量

向下滚动到 **Environment variables** 部分，点击 **Add variable** 添加以下变量：

```
NODE_VERSION = 20
UPSTASH_URL = https://your-url.upstash.io
UPSTASH_TOKEN = your-upstash-token
ADMIN_PASSWORD_HASH = your-password-hash
CRUST_TOKEN = your-crust-token
```

**重要：** 确保所有值都正确无误，错误的配置会导致部署失败。

#### 步骤 5：保存并部署

1. 点击 **Save and Deploy** 按钮
2. Cloudflare 会开始构建项目
3. 等待构建完成（通常需要 2-5 分钟）
4. 构建成功后，会显示访问链接：`https://crustshare.pages.dev`

#### 步骤 6：验证部署

1. 点击访问链接
2. 使用管理员密码登录
3. 测试文件上传功能
4. 测试分享功能

### 方式二：Wrangler CLI 部署（适合自动化）

#### 步骤 1：安装 Wrangler

```bash
# 全局安装 Wrangler
npm install -g wrangler

# 验证安装
wrangler --version
```

#### 步骤 2：登录 Cloudflare

```bash
wrangler login
```

执行后会自动打开浏览器，点击 **Allow** 授权。

#### 步骤 3：创建 wrangler.toml

在项目根目录创建 `wrangler.toml` 文件：

```toml
name = "crustshare"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# 构建设置
[build]
command = "npm run build"

# 静态资源目录
[site]
bucket = "./dist"

# 生产环境变量（非敏感信息）
[env.production.vars]
NODE_ENV = "production"
NODE_VERSION = "20"
```

#### 步骤 4：设置 Secrets（敏感信息）

```bash
# 设置 Upstash URL
wrangler secret put UPSTASH_URL
# 提示输入时粘贴: https://your-url.upstash.io

# 设置 Upstash Token
wrangler secret put UPSTASH_TOKEN
# 提示输入时粘贴: your-upstash-token

# 设置管理员密码哈希
wrangler secret put ADMIN_PASSWORD_HASH
# 提示输入时粘贴: your-password-hash

# 设置 Crust Token
wrangler secret put CRUST_TOKEN
# 提示输入时粘贴: your-crust-token
```

**注意：** Secrets 设置后不会显示在控制台，请妥善保管。

#### 步骤 5：部署

```bash
# 部署到预览环境
wrangler deploy

# 或部署到生产环境（如果有配置）
wrangler deploy --env production
```

部署完成后，Wrangler 会输出访问地址。

### 方式三：直接上传（适合快速测试）

#### 步骤 1：本地构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build
```

#### 步骤 2：使用 Wrangler 上传

```bash
# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=crustshare

# 如果是首次部署，会提示创建项目
# 输入 "y" 确认
```

#### 步骤 3：设置环境变量

由于直接上传无法携带环境变量，需要在 Cloudflare Dashboard 中手动设置：

1. 访问 [Cloudflare Pages](https://dash.cloudflare.com)
2. 找到你的项目
3. 点击 **Settings** → **Environment variables**
4. 添加所有必需的环境变量
5. 重新部署

### 部署后配置

#### 自定义域名

1. 在 Cloudflare Pages 项目页面，点击 **Custom domains** 标签
2. 点击 **Set up a custom domain**
3. 输入你的域名，例如：`share.yourdomain.com`
4. 点击 **Continue**
5. Cloudflare 会检查 DNS 配置：
   - 如果域名在 Cloudflare 管理，会自动添加 DNS 记录
   - 如果不在，需要手动添加 CNAME 记录指向 `crustshare.pages.dev`
6. 等待 SSL 证书自动配置（通常需要几分钟）
7. 配置完成后，可以通过自定义域名访问

#### 环境变量更新

如需更新环境变量：

1. 进入项目页面
2. 点击 **Settings** → **Environment variables**
3. 修改或添加变量
4. 点击 **Save**
5. 进入 **Deployments**，点击 **Retry deployment** 重新部署

#### 查看日志

```bash
# 实时查看日志
wrangler pages deployment tail --project-name=crustshare

# 查看特定部署的日志
wrangler pages deployment tail --project-name=crustshare --deployment-id=xxx
```

---

## Vercel 部署

### 步骤 1：导入项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New...** → **Project**
3. 点击 **Import Git Repository**
4. 授权并选择你的 GitHub 账号
5. 找到 `crustshare` 仓库，点击 **Import**

### 步骤 2：配置项目

在配置页面：

- **Framework Preset**: 选择 `Next.js`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 步骤 3：添加环境变量

展开 **Environment Variables** 部分，添加：

```
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-upstash-token
ADMIN_PASSWORD_HASH=your-password-hash
CRUST_TOKEN=your-crust-token
```

### 步骤 4：部署

点击 **Deploy** 按钮，等待构建完成。

### 自定义域名

1. 在项目页面点击 **Settings** → **Domains**
2. 输入你的域名
3. 按照提示配置 DNS
4. 等待 SSL 证书配置

---

## Docker 部署

### 构建 Docker 镜像

创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建
RUN npm run build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 暴露端口
EXPOSE 3000

# 启动
CMD ["npm", "start"]
```

### 构建并运行

```bash
# 构建镜像
docker build -t crustshare .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e UPSTASH_URL=https://your-url.upstash.io \
  -e UPSTASH_TOKEN=your-token \
  -e ADMIN_PASSWORD_HASH=your-hash \
  -e CRUST_TOKEN=your-token \
  --name crustshare \
  crustshare
```

### 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  crustshare:
    build: .
    ports:
      - "3000:3000"
    environment:
      - UPSTASH_URL=${UPSTASH_URL}
      - UPSTASH_TOKEN=${UPSTASH_TOKEN}
      - ADMIN_PASSWORD_HASH=${ADMIN_PASSWORD_HASH}
      - CRUST_TOKEN=${CRUST_TOKEN}
    restart: unless-stopped
```

创建 `.env` 文件：

```env
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token
ADMIN_PASSWORD_HASH=your-hash
CRUST_TOKEN=your-token
```

启动：

```bash
docker-compose up -d
```

---

## 常见问题排查

### 构建失败

#### 错误：Node 版本不兼容

```
Error: Node.js version 18.x is not supported. Please use Node.js 20.x or higher.
```

**解决：**
- Cloudflare Pages：设置环境变量 `NODE_VERSION=20`
- Vercel：在项目设置中选择 Node.js 20
- 本地：使用 nvm 切换到 Node 20

#### 错误：依赖安装失败

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
```

**解决：**
```bash
# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 错误：构建内存不足

```
FATAL ERROR: Reached heap limit Allocation failed
```

**解决：**
- Cloudflare Pages：无法调整，尝试优化代码
- 本地/Vercel：设置 `NODE_OPTIONS=--max-old-space-size=4096`

### 运行时错误

#### 错误：Redis 连接失败

```
Error: Connection refused to Upstash Redis
```

**排查：**
1. 检查 `UPSTASH_URL` 和 `UPSTASH_TOKEN` 是否正确
2. 检查 Upstash 数据库是否处于活跃状态
3. 检查网络连接

#### 错误：文件上传失败

```
Error: Failed to upload to Crust Network
```

**排查：**
1. 检查 `CRUST_TOKEN` 是否有效
2. 检查 Crust 账号余额是否充足
3. 检查文件大小是否超过限制（默认 1GB）

#### 错误：密码验证失败

```
Error: Invalid password
```

**排查：**
1. 检查 `ADMIN_PASSWORD_HASH` 是否正确生成
2. 确保使用的是 SHA-256 哈希
3. 重新生成哈希并更新环境变量

### 性能问题

#### 页面加载慢

**优化建议：**
1. 启用 Cloudflare CDN 缓存
2. 优化图片大小
3. 使用懒加载

#### 网关测试慢

**优化建议：**
1. 减少并发测试数量
2. 使用缓存的网关结果
3. 添加更多本地网关

### 其他问题

#### 如何查看详细日志

**Cloudflare Pages：**
```bash
wrangler pages deployment tail --project-name=crustshare
```

**Vercel：**
在 Vercel Dashboard → 项目 → Functions → 查看日志

#### 如何回滚部署

**Cloudflare Pages：**
1. 进入项目页面
2. 点击 **Deployments**
3. 找到之前的部署版本
4. 点击 **...** → **Rollback to this deployment**

**Vercel：**
1. 进入项目页面
2. 点击 **Deployments**
3. 找到之前的版本
4. 点击右侧的 **...** → **Promote to Production**

---

## 安全建议

1. **定期更换密码**：定期更新管理员密码并重新生成哈希
2. **保护环境变量**：不要将 `.env.local` 提交到 Git
3. **启用 HTTPS**：生产环境必须使用 HTTPS
4. **限制访问**：可以使用 Cloudflare Access 限制访问
5. **监控日志**：定期检查访问日志，发现异常及时处理

---

## 更新部署

### 更新代码后重新部署

**Git 集成方式：**
```bash
git add .
git commit -m "Update feature"
git push origin main
```
Cloudflare/Vercel 会自动触发重新部署。

**手动部署方式：**
```bash
# 拉取最新代码
git pull origin main

# 重新构建
npm run build

# 重新部署
wrangler pages deploy dist --project-name=crustshare
```

---

如有其他问题，请查看项目 Issues 或提交新的 Issue。
