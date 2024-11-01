# Stripe Revenue Dashboard

[English](./README_EN.md) | 简体中文

一个使用 Next.js 14、TypeScript 和 Tailwind CSS 构建的现代化实时收入分析仪表板。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)

## 功能特点

- 📊 实时收入跟踪和分析
- 💰 多币种支持，自动转换
- 📅 灵活的日期范围选择
- 🌍 多时区支持
- 📈 交互式图表和数据可视化
- 💳 支付类型分析（一次性支付 vs 订阅）
- 📱 响应式设计，支持所有设备
- 🔄 实时数据更新
- 🎨 使用 Tailwind CSS 的清新现代界面
- 🚀 一键部署支持

## 快速部署

[![Deploy to Cloudflare Pages](https://deploy.pages.dev/button)](https://deploy.pages.dev/github.com/yourusername/stripe-revenue-dashboard)

### 1. 点击部署
1. 点击上方的"部署到 Cloudflare Pages"按钮
2. 登录你的 Cloudflare 账户
3. 选择要部署的 Git 仓库

### 2. 配置环境变量
在 Cloudflare Pages 的部署界面中，添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|---------|
| STRIPE_SECRET_KEY | Stripe API密钥 | sk_test_xxxxx |
| DEFAULT_TIMEZONE | 默认时区 (可选) | Asia/Shanghai |

#### 获取 Stripe API 密钥:
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. 复制 Secret key (以 `sk_test_` 或 `sk_live_` 开头)

### 3. 部署设置
确保以下设置正确：
- 构建命令: `npm run build`
- 构建输出目录: `.next`
- Node.js 版本: 18

### 4. 多商户支持（可选）
如需查看多个商户数据，可添加多个密钥：
```plaintext
STRIPE_SECRET_KEY_1=sk_test_xxxxx
STRIPE_SECRET_KEY_2=sk_test_yyyyy
STRIPE_SECRET_KEY_3=sk_test_zzzzz
```

## 支持的时区
常用时区参考：
- `Asia/Shanghai` (中国)
- `Asia/Tokyo` (日本)
- `America/New_York` (美国东部)
- `Europe/London` (英国)
- `UTC` (世界标准时间)

## 本地开发

### 环境要求

- Node.js v18 或更高版本
- npm 或 yarn
- Stripe 账户和 API 密钥

### 1. 获取代码
```bash
git clone https://github.com/yourusername/stripe-revenue-dashboard.git
cd stripe-revenue-dashboard
```

### 2. 安装依赖
```bash
npm install
# 或
yarn install
```

### 3. 环境配置

1. 创建环境变量文件:
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件,填入必要的环境变量:
```plaintext
# Stripe API密钥 (必填)
STRIPE_SECRET_KEY=sk_test_xxxxx

# 多商户支持 (可选)
STRIPE_SECRET_KEY_1=sk_test_xxxxx
STRIPE_SECRET_KEY_2=sk_test_xxxxx

# 默认时区 (可选,默认为 Asia/Shanghai)
DEFAULT_TIMEZONE=Asia/Shanghai
```

### 4. 启动开发服务器
```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 查看仪表板。

## 项目结构

```plaintext
stripe-revenue-dashboard/
├── src/
│   ├── app/                 # Next.js 应用目录
│   ├── components/          # React 组件
│   ├── services/            # 业务逻辑服务
│   ├── utils/              # 工具函数
│   └── config/             # 配置文件
├── public/                 # 静态资源
├── .env.example           # 环境变量模板
├── next.config.mjs        # Next.js 配置
└── package.json           # 项目依赖
```

## 功能说明

### 1. 多商户支持
- 支持同时查看多个 Stripe 账户的数据
- 在环境变量中配置多个 STRIPE_SECRET_KEY

### 2. 数据分析
- 收入趋势图表
- 支付类型分布
- 订阅收入分析
- 多币种汇总

### 3. 时区和货币
- 支持多个时区查看
- 自动汇率转换
- 灵活的货币显示选项

## 常见问题

1. Q: 部署后显示 "No Stripe keys configured" 错误
   A: 检查是否正确配置了 STRIPE_SECRET_KEY 环境变量

2. Q: 如何添加多个商户?
   A: 在环境变量中添加多个 Stripe 密钥:
   ```plaintext
   STRIPE_SECRET_KEY_1=sk_test_xxx
   STRIPE_SECRET_KEY_2=sk_test_yyy
   ```

3. Q: 如何修改默认时区?
   A: 在环境变量中设置 DEFAULT_TIMEZONE，例如:
   ```plaintext
   DEFAULT_TIMEZONE=America/New_York
   ```

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细更新历史。

## 贡献指南

欢迎提交 Pull Request 和 Issue！请确保:
1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件