# Stripe Revenue Dashboard

一个基于 Next.js 构建的 Stripe 收入仪表板，部署在 Cloudflare Pages 上。

## 功能特点

- 📊 实时显示 Stripe 收入数据
- 🌍 支持多时区显示（默认：Asia/Shanghai）
- 💫 基于 Next.js 构建的现代化 UI
- ⚡ 通过 Cloudflare Pages 实现快速全球访问

## 技术栈

- Next.js 14
- TypeScript
- Cloudflare Pages
- Stripe API
- TailwindCSS

## 开始使用

### 前置要求

- Node.js 18+
- npm 或 yarn
- Stripe 账户
- Cloudflare 账户

### 本地开发

1. 克隆仓库
   ```bash
   git clone https://github.com/your-username/stripe-revenue-dashboard.git
   cd stripe-revenue-dashboard
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   ```bash
   cp .env.example .env.local
   ```
   编辑 `.env.local` 文件，填入你的 Stripe Secret Key。

4. 启动开发服务器
   ```bash
   npm run dev
   ```

### 部署

1. Fork 这个仓库

2. 在 Cloudflare Pages 中创建新项目

3. 连接你的 GitHub 仓库

4. 配置构建设置：
   - 构建命令：`npm run build`
   - 构建输出目录：`.next`

5. 在环境变量中添加：
   - `STRIPE_SECRET_KEY`
   - `DEFAULT_TIMEZONE`（可选，默认为 "Asia/Shanghai"）

## 环境变量

| 变量名 | 描述 | 必填 |
|--------|------|------|
| STRIPE_SECRET_KEY | Stripe API 密钥 | 是 |
| DEFAULT_TIMEZONE | 默认时区 | 否 |

## 开发指南

### 项目结构

```
src/
├── app/ # Next.js 应用目录
│ ├── api/ # API 路由
│ └── page.tsx # 主页面
├── config/ # 配置文件
│ └── services/ # 服务层（Stripe API 等）
├── types/ # TypeScript 类型定义
├── utils/ # 工具函数
└── package.json # 项目配置文件
```

### API 端点

- `GET /api/get-revenue` - 获取收入数据

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 支持

如有问题或建议，请开启 Issue 或发起讨论。