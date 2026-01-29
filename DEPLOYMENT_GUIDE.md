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

Vercel 会自动识别 Next.js，通常无需修改：

| 设置项 | 值 |
|--------|-----|
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | 自动检测 |

### 步骤 3：环境变量

在 **Environment Variables** 添加：

```
UPSTASH_URL=https://your-url.upstash.io
UPSTASH_TOKEN=your-token
ADMIN_PASSWORD=你的明文密码
ADMIN_PASSWORD_HASH=你的sha256哈希
CRUST_TOKEN=your-crust-token
```

### 步骤 4：部署

点击 **Deploy**，等待 2-3 分钟完成构建。

---

## 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `UPSTASH_URL` | ✅ | Upstash REST API URL |
| `UPSTASH_TOKEN` | ✅ | Upstash REST API Token |
| `ADMIN_PASSWORD` | ✅ | 管理员密码（明文） |
| `ADMIN_PASSWORD_HASH` | ✅ | SHA256 哈希密码 |
| `CRUST_TOKEN` | ✅ | Crust Network API Token |

---

## 故障排查

### 构建失败

```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

### API 返回 401

- 检查环境变量是否正确设置
- 确认密码哈希生成正确

### 文件上传失败

- 验证 `CRUST_TOKEN` 是否有效
- 检查 Upstash 配置

### 样式丢失

确保 `next.config.js`：

```javascript
const nextConfig = {
  output: 'export',
  distDir: 'dist',
}
```

---

## 部署检查清单

- [ ] 代码推送到 GitHub
- [ ] Upstash Redis 创建完成
- [ ] Crust Token 获取成功
- [ ] 密码哈希生成正确
- [ ] 环境变量配置完整
- [ ] 构建成功无错误
- [ ] 登录功能正常
- [ ] 文件上传/下载正常

---

完成！🎉
