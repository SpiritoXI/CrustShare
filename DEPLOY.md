# CrustShare 部署教程

本文档提供 CrustShare 项目的完整部署指南，包含环境准备、配置说明和多种部署方式。

## 目录

1. [环境要求](#环境要求)
2. [准备工作](#准备工作)
3. [本地开发](#本地开发)
4. [Cloudflare Pages 部署](#cloudflare-pages-部署)
5. [Vercel 部署](#vercel-部署)
6. [Docker 部署](#docker-部署)
7. [常见问题排查](#常见问题排查)

---

## 环境要求

### 系统要求

| 项目 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 20.x | 运行环境 |
| pnpm | >= 8.x | 包管理器（推荐）|
| npm | >= 10.x | 备选包管理器 |
| Git | >= 2.x | 版本控制 |

### 验证环境

```bash
# 检查 Node.js 版本
node -v
# 输出: v20.x.x

# 检查 pnpm 版本
pnpm -v
# 输出: 8.x.x

# 检查 Git 版本
git --version
# 输出: git version 2.x.x
```

---

## 准备工作

部署 CrustShare 需要以下服务的账号和凭证：

### 1. Upstash Redis（必需）

用于存储文件元数据、文件夹信息和分享配置。

**注册步骤：**

1. 访问 [Upstash](https://upstash.com/)
2. 点击 **Sign Up**，使用 GitHub 账号登录
3. 进入控制台，点击 **Create Database**
4. 选择 **Redis**
5. 配置数据库：
   - **Database Name**: `crustshare`（或自定义）
   - **Region**: 选择离你最近的区域（推荐 `ap-southeast-1` 新加坡）
   - **Type**: 选择 **Free**（免费版足够）
6. 点击 **Create**
7. 创建完成后，进入数据库详情页，复制以下信息：
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

### 3. 生成管理员密码哈希

使用以下命令生成 SHA-256 哈希：

```bash
# 替换 your-password 为你想要的管理员密码
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"

# 示例输出
0192023a7bbd73250516f069df18b500...
```

**保存好生成的哈希值**，后续配置需要用到。

---

## 本地开发

### 1. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/yourusername/crustshare.git
cd crustshare
```

### 2. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的配置：

```env
# ============================================
# Upstash Redis 配置（必需）
# ============================================
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-upstash-token

# ============================================
# 管理员密码（SHA256 哈希，必需）
# 生成方式: node -e "console.log(require('crypto').createHash('sha256').update('密码').digest('hex'))"
# ============================================
ADMIN_PASSWORD_HASH=your-password-hash

# ============================================
# Crust Token（必需）
# 获取: https://crustcloud.io/
# ============================================
CRUST_TOKEN=your-crust-token

# ============================================
# 可选配置
# ============================================
# 默认每页显示文件数
DEFAULT_PAGE_SIZE=20

# 上传文件大小限制（字节，默认 1GB）
MAX_UPLOAD_SIZE=1073741824

# 分享链接默认过期天数
DEFAULT_SHARE_EXPIRY_DAYS=7
```

### 4. 启动开发服务器

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

Cloudflare Pages 是推荐的部署方式，提供全球 CDN 加速和边缘函数支持。

### 前置要求

- Cloudflare 账号
- GitHub 账号（用于代码仓库）

### 部署步骤

#### 第一步：准备代码仓库

1. Fork 本仓库到你的 GitHub 账号
2. 或者创建新的仓库并推送代码

#### 第二步：创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单 **Pages**
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权 Cloudflare 访问你的 GitHub 账号
6. 选择你 fork 的 crustshare 仓库
7. 点击 **Begin setup**

#### 第三步：配置构建设置

在构建设置页面填写以下信息：

| 配置项 | 值 |
|--------|-----|
| Project name | `crustshare`（或自定义）|
| Production branch | `main` |
| Framework preset | `Next.js` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

#### 第四步：添加环境变量

在 **Environment variables** 区域添加以下变量：

```
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-upstash-token
ADMIN_PASSWORD_HASH=your-password-hash
CRUST_TOKEN=your-crust-token
```

#### 第五步：部署

1. 点击 **Save and Deploy**
2. 等待构建完成（约 2-5 分钟）
3. 构建成功后，点击 **Continue to project**
4. 在 **Deployments** 标签页查看部署状态

#### 第六步：配置自定义域名（可选）

1. 进入项目设置
2. 点击 **Custom domains** 标签
3. 点击 **Set up a custom domain**
4. 输入你的域名并按照提示配置 DNS

### 部署验证

部署完成后，访问分配的域名（如 `https://crustshare.pages.dev`），确认：

1. 登录页面正常显示
2. 使用管理员密码可以登录
3. 文件上传功能正常
4. 分享功能正常

---

## Vercel 部署

Vercel 提供快速的 Next.js 应用部署和自动预览功能。

### 前置要求

- Vercel 账号
- GitHub 账号

### 部署步骤

#### 第一步：导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New Project**
3. 选择 **Import Git Repository**
4. 授权 Vercel 访问你的 GitHub 账号
5. 选择 crustshare 仓库，点击 **Import**

#### 第二步：配置项目

在配置页面填写以下信息：

| 配置项 | 值 |
|--------|-----|
| Project Name | `crustshare`（或自定义）|
| Framework Preset | `Next.js` |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

#### 第三步：添加环境变量

展开 **Environment Variables** 区域，添加：

```
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-upstash-token
ADMIN_PASSWORD_HASH=your-password-hash
CRUST_TOKEN=your-crust-token
```

#### 第四步：部署

1. 点击 **Deploy**
2. 等待构建完成
3. 部署成功后，Vercel 会分配一个域名

### Vercel 注意事项

- Vercel 的免费版有函数执行时间限制（10秒），大文件上传可能超时
- 建议使用 Cloudflare Pages 获得更好的边缘函数支持

---

## Docker 部署

使用 Docker 可以自托管部署，适合有服务器的用户。

### 前置要求

- Docker >= 20.x
- Docker Compose >= 2.x

### 部署步骤

#### 第一步：创建 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/server.js"]
```

#### 第二步：创建 docker-compose.yml

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

#### 第三步：创建 .env 文件

```bash
# 创建环境变量文件
cat > .env << EOF
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-upstash-token
ADMIN_PASSWORD_HASH=your-password-hash
CRUST_TOKEN=your-crust-token
EOF
```

#### 第四步：构建并运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 第五步：验证部署

访问 `http://localhost:3000` 验证服务是否正常运行。

### Docker 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f

# 更新部署（拉取最新代码后）
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 常见问题排查

### 1. 构建失败

**问题：** `npm run build` 失败

**排查步骤：**

```bash
# 1. 清除缓存
rm -rf node_modules .next dist

# 2. 重新安装依赖
pnpm install

# 3. 检查 TypeScript 错误
pnpm typecheck

# 4. 再次构建
pnpm build
```

### 2. 环境变量错误

**问题：** 提示缺少环境变量

**解决方案：**

1. 确认 `.env.local` 文件存在且配置正确
2. 检查变量名是否拼写正确
3. 重新启动开发服务器

### 3. Upstash 连接失败

**问题：** 无法连接 Redis 数据库

**排查步骤：**

1. 检查 `UPSTASH_URL` 和 `UPSTASH_TOKEN` 是否正确
2. 在 Upstash 控制台确认数据库状态为 **Active**
3. 检查网络连接是否正常
4. 尝试在本地使用 curl 测试连接：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-url.upstash.io/get/test
```

### 4. 文件上传失败

**问题：** 无法上传文件到 Crust Network

**排查步骤：**

1. 检查 `CRUST_TOKEN` 是否有效
2. 在 Crust Cloud 控制台确认 Token 状态
3. 检查文件大小是否超过限制（默认 1GB）
4. 查看浏览器控制台的网络请求错误

### 5. 登录失败

**问题：** 管理员密码无法登录

**排查步骤：**

1. 重新生成密码哈希：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

2. 更新 `ADMIN_PASSWORD_HASH` 环境变量
3. 重新部署或重启服务

### 6. Cloudflare Pages 部署后 404

**问题：** 部署成功后访问页面显示 404

**解决方案：**

1. 检查构建设置中的 **Output directory** 是否为 `dist`
2. 检查 `_routes.json` 文件是否存在
3. 在 Cloudflare Pages 设置中检查 **Build output directory**

### 7. 网关测试失败

**问题：** 无法测试 IPFS 网关

**排查步骤：**

1. 检查网络连接
2. 确认浏览器没有阻止跨域请求
3. 尝试添加自定义网关
4. 清除浏览器缓存后重试

### 8. 分享链接无法访问

**问题：** 生成的分享链接无法打开

**排查步骤：**

1. 确认 CID 有效
2. 检查网关是否可用
3. 尝试切换其他网关
4. 确认文件已在 IPFS 网络中可用

---

## 性能优化建议

### 1. 启用 CDN

使用 Cloudflare 或 Vercel 的 CDN 加速静态资源。

### 2. 图片优化

- 使用 WebP 格式
- 启用图片懒加载
- 使用适当的图片尺寸

### 3. 代码分割

Next.js 自动进行代码分割，确保按需加载。

### 4. 缓存策略

- 网关测试结果缓存 10 分钟
- 文件列表适当缓存
- 使用 Service Worker 缓存静态资源

---

## 安全建议

### 1. 密码安全

- 使用强密码（至少 12 位，包含大小写字母、数字、符号）
- 定期更换管理员密码
- 不要将密码哈希提交到代码仓库

### 2. 环境变量

- 使用 `.env.local` 存储敏感信息
- 生产环境使用平台提供的环境变量管理
- 定期轮换 API Token

### 3. 访问控制

- 启用 Cloudflare 的 DDoS 防护
- 配置适当的 CORS 策略
- 监控异常访问日志

---

## 获取帮助

如果遇到问题无法解决，可以通过以下方式获取帮助：

1. 查看项目 [Issues](https://github.com/yourusername/crustshare/issues)
2. 提交新的 Issue，描述问题和复现步骤
3. 查看 Cloudflare/Vercel 官方文档

---

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。
