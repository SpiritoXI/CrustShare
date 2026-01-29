# 贡献指南

感谢你对 CrustShare 的兴趣！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug

1. 确认 Bug 尚未被报告
2. 创建 Issue，包含：
   - 问题描述
   - 复现步骤
   - 期望行为
   - 实际行为
   - 环境信息（浏览器、系统等）

### 提交功能建议

1. 创建 Issue，标题以 `[Feature]` 开头
2. 描述功能的用途和实现思路

### 提交代码

1. Fork 仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "Add feature"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 开发规范

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 配置
- 使用 Prettier 格式化

### 提交信息

```
类型: 简短描述

详细说明（可选）
```

类型：
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 文件组织

```
app/          # 页面和 API
components/   # 组件
lib/          # 工具函数
types/        # 类型定义
```

## 本地开发

```bash
npm install
npm run dev
```

## 测试

```bash
npm run lint
npm run typecheck
```

## 行为准则

- 尊重他人
- 欢迎新手
- 专注于建设性讨论

## 联系方式

- Issue: [GitHub Issues](https://github.com/yourusername/crustshare/issues)

感谢你的贡献！
