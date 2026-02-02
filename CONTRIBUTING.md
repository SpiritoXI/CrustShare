# 贡献指南

感谢您对 CrustShare 项目的关注！我们欢迎并感谢所有形式的贡献。

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [提交规范](#提交规范)
- [代码规范](#代码规范)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)
- [功能建议](#功能建议)

## 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与本项目即表示您同意遵守此准则。

### 我们的承诺

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请通过 [GitHub Issues](https://github.com/yourusername/crustshare/issues) 报告。

报告时请包含以下信息：

- 问题的清晰描述
- 复现步骤
- 期望行为
- 实际行为
- 截图（如适用）
- 环境信息（操作系统、浏览器版本等）

### 建议新功能

我们欢迎新功能的建议！请通过 GitHub Issues 提交，并包含：

- 功能的清晰描述
- 为什么这个功能会有帮助
- 可能的实现方案（可选）

### 提交代码

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 开发环境设置

### 前提条件

- Node.js >= 20.x
- pnpm >= 8.x
- Git >= 2.x

### 设置步骤

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/yourusername/crustshare.git
cd crustshare

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入您的配置

# 4. 启动开发服务器
pnpm dev

# 5. 运行测试
pnpm typecheck
```

### 开发工作流

```bash
# 创建新分支
git checkout -b feature/your-feature-name

# 进行开发...

# 运行类型检查
pnpm typecheck

# 构建测试
pnpm build

# 提交更改
git add .
git commit -m "feat: add new feature"

# 推送到远程
git push origin feature/your-feature-name
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来规范提交信息。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响代码运行的变动）|
| `refactor` | 重构（既不是新增功能，也不是修改 Bug）|
| `perf` | 性能优化 |
| `test` | 增加测试 |
| `chore` | 构建过程或辅助工具的变动 |
| `ci` | CI 配置 |
| `build` | 构建系统或外部依赖的更改 |

### 示例

```bash
# 新功能
feat: add file upload retry mechanism

# 修复 Bug
fix: resolve Redis connection timeout issue

# 文档更新
docs: update README with new features

# 性能优化
perf: optimize gateway testing algorithm

# 重构
refactor: simplify error handling logic
```

## 代码规范

### TypeScript 规范

- 使用严格模式 (`strict: true`)
- 为所有函数参数和返回值添加类型
- 避免使用 `any` 类型
- 使用接口（interface）定义对象类型

### React 规范

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- Hook 名使用 camelCase 并以 `use` 开头
- Props 使用解构赋值

### 样式规范

- 使用 Tailwind CSS 进行样式编写
- 遵循现有的设计系统和颜色方案
- 保持响应式设计

### 文件命名规范

- 组件文件：PascalCase（如 `FileList.tsx`）
- 工具文件：camelCase（如 `api.ts`）
- Hook 文件：camelCase 以 `use` 开头（如 `useUpload.ts`）

### 代码示例

```typescript
// ✅ 好的示例
interface FileRecord {
  id: string;
  name: string;
  size: number;
  cid: string;
}

export function useFileOperations() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  
  const handleDelete = useCallback(async (fileId: string): Promise<void> => {
    // 实现...
  }, []);
  
  return { files, handleDelete };
}

// ❌ 不好的示例
function useFileOperations() {
  const [files, setFiles] = useState<any[]>([]);  // 避免使用 any
  
  const handleDelete = async (fileId) => {  // 缺少类型
    // 实现...
  };
  
  return { files, handleDelete };
}
```

## Pull Request 流程

### 创建 PR 前

1. 确保代码可以正常构建
2. 运行类型检查 (`pnpm typecheck`)
3. 更新相关文档
4. 添加必要的测试

### PR 描述模板

```markdown
## 描述
简要描述这个 PR 做了什么

## 类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构

## 测试
- [ ] 本地测试通过
- [ ] 类型检查通过

## 相关 Issue
Fixes #(issue 编号)
```

### PR 审查流程

1. 维护者会审查您的 PR
2. 可能需要根据反馈进行修改
3. 通过审查后会被合并到主分支

## 问题报告

### 报告前检查

在报告问题之前，请：

1. 搜索现有的 Issues，确认问题没有被报告过
2. 确认使用的是最新版本
3. 尝试在干净的环境中复现问题

### 报告模板

```markdown
**问题描述**
清晰简洁地描述问题

**复现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 出现错误

**期望行为**
清晰描述您期望发生什么

**实际行为**
清晰描述实际发生了什么

**截图**
如果适用，添加截图帮助解释问题

**环境信息**
- 操作系统: [例如 Windows 10]
- 浏览器: [例如 Chrome 91]
- 版本: [例如 3.0.0]

**其他信息**
添加任何其他相关信息
```

## 功能建议

### 建议前考虑

- 这个功能是否符合项目目标？
- 是否会对现有用户造成影响？
- 实现复杂度如何？

### 建议模板

```markdown
**功能描述**
清晰描述您想要的功能

**使用场景**
描述这个功能会在什么场景下使用

**期望行为**
描述您期望这个功能如何工作

**替代方案**
描述您考虑过的替代方案

**其他信息**
添加任何其他相关信息或截图
```

## 开发提示

### 调试技巧

```bash
# 启用详细日志
DEBUG=true pnpm dev

# 检查类型
pnpm typecheck

# 构建生产版本
pnpm build
```

### 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck

# 清理缓存
rm -rf node_modules .next dist
```

## 社区

- 加入讨论：[GitHub Discussions](https://github.com/yourusername/crustshare/discussions)
- 关注更新：[Releases](https://github.com/yourusername/crustshare/releases)

## 许可证

通过贡献代码，您同意您的贡献将在 [MIT 许可证](./LICENSE.md) 下发布。

## 致谢

感谢所有为这个项目做出贡献的人！

---

如有任何问题，欢迎通过 GitHub Issues 联系我们。
