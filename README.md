# Stripe Revenue Dashboard

[English](./README_EN.md) | 简体中文

一个使用 Next.js 14、TypeScript 和 Tailwind CSS 构建的现代化实时收入分析仪表板。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zinc1234596/stripe-revenue-dashboard)

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

### 方法 1：一键部署到 Cloudflare Pages

1. 点击上方的 "Deploy to Cloudflare Pages" 按钮
2. 登录你的 Cloudflare 账号
3. 设置以下环境变量：
   - `STRIPE_SECRET_KEY`: 你的 Stripe Secret Key (以 sk_test_ 或 sk_live_ 开头)
   - `DEFAULT_TIMEZONE`: 默认时区 (可选，默认为 "Asia/Shanghai")

### 方法 2：手动部署

1. Fork 这个仓库
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com)
3. 创建新项目并选择你 fork 的仓库
4. 设置构建配置：
   - 构建命令：`npm run build`
   - 构建输出目录：`.next`
5. 设置环境变量：
   - `STRIPE_SECRET_KEY`: 你的 Stripe Secret Key
   - `DEFAULT_TIMEZONE`: 默认时区 (可选)

## 本地开发