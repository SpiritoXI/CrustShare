# ☁️ CloudChan（直连版）

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Cloudflare_Pages-orange)
![Storage](https://img.shields.io/badge/storage-Crust_Network-green)
![Security](https://img.shields.io/badge/security-Enterprise%20Level-green)
![Version](https://img.shields.io/badge/version-v2.2.1-purple)

**CloudChan** 是一个极简主义的无服务器（Serverless）Web3 个人网盘解决方案。
它采用 **Hybrid 直连架构**：利用 Cloudflare Functions 作为安全发卡中心，前端获取授权后 **直连 Crust Network 官方网关** 进行高速上传。

**核心特性：**
* ⚡ **极速直连**：摒弃中转代理，文件直接从浏览器上传至 Crust 官网，速度取决于你的带宽，不再受 Cloudflare CPU/流量限制。
* 🔒 **企业级安全**：所有敏感信息（数据库连接、Token）存储在 Cloudflare 后端环境变量中，前端代码完全无感，源码不暴露任何私钥。
* 🌍 **全球加速**：集成全球主流 IPFS 公共网关（Cloudflare, IPFS.io, Pinata 等）并支持自动测速，下载体验飞起。
* ☁️ **完全免费**：基于 Cloudflare Pages 和 Upstash Free Tier 构建，零成本部署。

## 🛠️ 快速开始

### 方式一：完整部署指南（推荐）

如果你想从零开始部署，请查看详细文档：
👉 **[DEPLOYMENT_GUIDE.md](./docs/guides/DEPLOYMENT_GUIDE.md)**

### 方式二：快速体验

**当前版本**: v2.2.1（2026-01-22）

**最新特性**:
- ✨ 全新 UI 设计，现代化 Glassmorphism 风格
- 🎨 丰富的动画效果和交互反馈
- 📱 优化的响应式设计，完美支持移动端
- ⚡ 网关测试缓存（10分钟），避免重复测速
- 🧹 网关自动清理机制，保持列表健康
- 📊 网关健康追踪（30天），智能排序
- 💾 **存储空间统计**：实时显示文件总数、文件夹总数和总存储空间
- 📁 **文件夹管理**：支持创建、删除、重命名和嵌套文件夹
- 📑 **批量操作**：支持选择多个文件进行批量删除和移动
- 🔍 **文件搜索**：支持按文件名和扩展名搜索文件
- 📄 **分页加载**：支持分页查看文件列表，提高大量文件下的性能
- 📜 **懒加载**：文件列表滚动到接近底部时自动加载下一页
- 🔒 **XSS/CSRF防护**：增强的安全防护措施，防止跨站攻击
- 📂 **树状文件夹结构**：支持嵌套文件夹的可视化管理
- 🧠 **长文件名友好**：列表支持两行显示，点击可展开/收起
- ✏️ **重命名更安全**：默认隐藏后缀编辑，可一键显示/编辑后缀

### 方式三：快速部署步骤（根站点模式）

#### 1. 准备账号
* ✅ [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
* ✅ [GitHub 账号](https://github.com/signup)
* ✅ [Upstash Redis](https://upstash.com) (免费)
* ✅ [Crust Files](https://crustfiles.io) (免费)

#### 2. Fork 仓库
点击右上角的 **Fork** 按钮，将仓库复制到你的 GitHub。

#### 3. 连接 Cloudflare Pages
1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **Create application**
3. 选择 **Pages** → **Connect to Git**
4. 选择你 Fork 的仓库

#### 4. 配置环境变量（关键！）

在 Cloudflare Pages → **Settings** → **Environment Variables**，添加以下 4 个变量：

| 变量名 | 值 | 获取方式 |
|--------|-----|----------|
| `UPSTASH_URL` | `https://xxx.upstash.io` | Upstash Console → REST API |
| `UPSTASH_TOKEN` | `AVyGAAInc...` | Upstash Console → REST API |
| `ADMIN_PASSWORD` | `你的强密码` | 自定义（至少 16 位） |
| `CRUST_TOKEN` | `Basic c3Vi...` | Crust Files → API Keys |

⚠️ **重要**：添加完环境变量后，点击 **Deployments** → **Retry deployment** 让变量生效！

#### 5. 开始使用
1. 访问你的网站域名根路径（如：`https://cloudchan.pages.dev/`）
2. 输入管理员密码登录
3. 开始上传、下载、管理文件！

## 🔒 安全架构

### 传统方式（不安全） ❌
```
浏览器 ──直接访问──> Upstash 数据库
         ❌ 暴露 Token，任何人都能看到
```

### CloudChan 方式（安全） ✅
```
浏览器 ──API 调用──> Cloudflare Functions ──安全访问──> Upstash 数据库
         ✅ Token 存储在环境变量中，前端完全无感
```

### 安全特性

* ✅ **零暴露**：数据库连接信息完全隐藏在后端环境变量中
* ✅ **代理模式**：所有数据库操作通过后端代理接口完成
* ✅ **密码验证**：每个 API 请求都需要管理员密码验证
* ✅ **HTTPS 加密**：所有通信使用 HTTPS 加密传输
* ✅ **源码安全**：前端代码不包含任何敏感信息
* ✅ **XSS 防护**：所有用户输入都经过严格的 HTML 转义处理
* ✅ **CSRF 防护**：所有非 GET 请求都需要 CSRF 令牌验证
* ✅ **安全的 fetch 封装**：所有 API 请求都通过安全的 fetch 包装函数发送

## 📚 详细文档

### 📘 用户指南
| 文档 | 说明 |
|------|------|
| **[DEPLOYMENT_GUIDE.md](./docs/guides/DEPLOYMENT_GUIDE.md)** | 🚀 完整的部署指南，从零开始 |
| **[SECURITY_GUIDE.md](./docs/guides/SECURITY_GUIDE.md)** | 🔒 详细的安全配置说明 |
| **[SMART_GATEWAY_GUIDE.md](./docs/guides/SMART_GATEWAY_GUIDE.md)** | ⚡ 智能网关功能使用指南 |
| **[SMART_CACHE_GUIDE.md](./docs/guides/SMART_CACHE_GUIDE.md)** | 💾 智能缓存功能使用指南 |
| **[FILE_MANAGER_GUIDE.md](./docs/guides/FILE_MANAGER_GUIDE.md)** | 📁 文件管理页使用指南 |

### 📖 项目文档
| 文档 | 说明 |
|------|------|
| **[CHANGELOG.md](./CHANGELOG.md)** | 版本更新日志 |
| **[docs/README.md](./docs/README.md)** | 文档中心快速导航 |

## 🎯 功能特性

### 文件上传
- ⚡ 直连 Crust Network，速度取决于你的带宽
- 📊 实时上传进度显示
- 🔒 安全的 Token 获取机制
- 📦 支持大文件（默认限制 1GB，可在配置中调整）
- 🖱️ 支持拖拽上传

### 文件下载
- 🌍 多网关并发测速，自动选择最快的
- 🚀 集成全球主流 IPFS 网关
- 📊 显示每个网关的延迟
- 🔍 支持动态探测新网关

### 文件管理
- 📝 文件列表展示（文件名、大小、日期）
- ✏️ **文件改名**：支持重命名文件记录
- 📤 **文件传播**：主动将文件传播到全球主流IPFS公共网关，提高访问速度和可靠性
- 🗑️ 安全删除记录（IPFS 上的文件永久保存）
- 🔄 一键刷新列表
- 🔍 实时状态反馈
- 💾 **存储空间统计**：实时显示文件总数、文件夹总数和总存储空间
- 📁 **文件夹管理**：支持创建、删除、重命名和嵌套文件夹
- 📑 **批量操作**：支持选择多个文件进行批量删除和移动
- 🔍 **文件搜索**：支持按文件名和扩展名搜索文件
- 📄 **分页加载**：支持分页查看文件列表，提高大量文件下的性能
- 📜 **懒加载**：文件列表滚动到接近底部时自动加载下一页
- 📂 **树状文件夹结构**：支持嵌套文件夹的可视化管理

## 🔧 技术栈

### 前端
- **HTML5** - 语义化标签，可访问性优化
- **CSS3** - Glassmorphism 设计，响应式布局
- **Vanilla JavaScript** - 纯原生，无框架依赖
- **ES6+** - 模块化，现代 JavaScript

### 后端
- **Cloudflare Pages** - 无服务器托管
- **Cloudflare Functions** - Serverless 函数
- **Upstash Redis** - 高性能数据库

### 存储
- **Crust Network** - 去中心化 IPFS 存储
- **IPFS 公共网关** - 全球加速下载

## 📖 常见问题

### Q: 为什么需要设置环境变量？
A: 环境变量是存储敏感信息（数据库连接、Token）的安全方式，它们在后端运行，不会暴露给前端用户。

### Q: 如何查看我的环境变量是否配置成功？
A: 在 Cloudflare Pages → Settings → Environment Variables 中查看列表，应该显示 4 个变量。

### Q: 添加环境变量后不生效怎么办？
A: 进入 Deployments 页面，点击最新部署的 "⋮" → "Retry deployment"，等待重新部署完成。

### Q: 如何确认我的部署是安全的？
A: 打开浏览器开发者工具（F12）→ Network 标签，执行操作后检查请求列表，应该只看到 `/api/get_token` 和 `/api/db_proxy`，不应该看到 Upstash URL。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)

## 🙏 致谢

- [Cloudflare Pages](https://pages.cloudflare.com/) - 无服务器托管平台
- [Upstash](https://upstash.com/) - Redis 数据库
- [Crust Network](https://crust.network/) - 去中心化存储
- [IPFS](https://ipfs.io/) - 分布式文件系统

---

**如果你觉得 CloudChan 对你有帮助，请给它一个 ⭐ Star！**

有问题？查看 [详细文档](./docs/guides/DEPLOYMENT_GUIDE.md) 或提交 [Issue](../../issues)
