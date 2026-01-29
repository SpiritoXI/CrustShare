# 部署指南

支持 Cloudflare Pages 和 Vercel 两种部署方式。

## 目录

- [准备工作](#准备工作)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [Vercel 部署](#vercel-部署)
- [环境变量](#环境变量)
- [故障排查](#故障排查)

---

## 准备工作

### 1. 注册账号

- [GitHub](https://github.com) - 代码托管
- [Cloudflare](https://dash.cloudflare.com) 或 [Vercel](https://vercel.com) - 部署平台
- [Upstash](https://upstash.com) - Redis 数据库

### 2. 获取 Crust Token

1. 访问 [Crust Files](https://files.crust.network/)
2. 登录账号
3. 在设置中获取 API Token

### 3. 生成密码哈希

```bash
node -e "console.log(require('crypto').createHash('sha256').update('你的密码').digest('hex'))"
```

---

## Cloudflare Pages 部署

### 步骤 1：推送代码

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/crustshare.git
git push -u origin main
```

### 步骤 2：创建 Upstash Redis

1. 登录 [Upstash Console](https://console.upstash.com)
2. 点击 "Create Database"
3. 选择区域（建议选离你最近的）
4. 复制 **REST API** 中的 `UPSTASH_URL` 和 `UPSTASH_TOKEN`

### 步骤 3：Cloudflare Pages 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **Pages** → **Create a project**
3. 选择 **Connect to Git**
4. 授权 GitHub，选择你的仓库

**构建设置：**

| 设置项 | 值 |
|--------|-----|
| Framework preset | Next.js |
| Build command | `npm run build` |
| Build output directory | `dist` |

**环境变量：**

```
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token
ADMIN_PASSWORD=你的明文密码
ADMIN_PASSWORD_HASH=你的sha256哈希
CRUST_TOKEN=your-crust-token
```

5. 点击 **Save and Deploy**

### 步骤 4：自定义域名（可选）

1. 进入项目 → **Custom domains**
2. 添加你的域名
3. 按提示配置 DNS

---

## Vercel 部署

### 步骤 1：导入项目

1. 登录 [Vercel](https://vercel.com)
2. 点击 **Add New Project**
3. 选择 GitHub 仓库，点击 **Import**

### 步骤 2：配置项目

**构建设置：**

| 设置项 | 值 |
|--------|-----|
| Framework preset | Next.js |
| Build command | `npm run build` |
| Output directory | `dist` |

**环境变量：**

与 Cloudflare Pages 相同

### 步骤 3：部署

点击 **Deploy**

---

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `UPSTASH_URL` | Upstash Redis URL | 是 |
| `UPSTASH_TOKEN` | Upstash Redis Token | 是 |
| `ADMIN_PASSWORD` | 管理员明文密码 | 是 |
| `ADMIN_PASSWORD_HASH` | SHA256 哈希密码 | 是 |
| `CRUST_TOKEN` | Crust Network API Token | 是 |

---

## 故障排查

### 构建失败

1. 检查 Node.js 版本是否 >= 18
2. 检查 `package.json` 中的构建脚本
3. 查看构建日志获取详细错误

### 数据库连接失败

1. 确认 Upstash URL 和 Token 正确
2. 检查 Upstash 数据库是否处于活跃状态
3. 确认环境变量名称正确

### 登录失败

1. 确认 `ADMIN_PASSWORD` 和 `ADMIN_PASSWORD_HASH` 配置正确
2. 检查密码哈希生成方式是否正确
3. 清除浏览器缓存后重试

### 文件上传失败

1. 确认 `CRUST_TOKEN` 有效
2. 检查文件大小是否超过 1GB 限制
3. 查看浏览器控制台网络请求

---

## 更新部署

代码更新后，推送到 GitHub 会自动触发重新部署。

```bash
git add .
git commit -m "Update"
git push
```
