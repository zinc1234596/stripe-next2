module.exports = {
  // 构建输出目录
  distDir: ".next",

  // 构建命令
  buildCommand: "npm run build",

  // 开发命令
  devCommand: "npm run dev",

  // 环境变量配置
  env: {
    STRIPE_SECRET_KEY: "",
    DEFAULT_TIMEZONE: "Asia/Shanghai",
  },

  // 路由规则
  routes: [
    // 处理 Next.js 的动态路由
    { src: "/_next/static/(.*)", dest: "/_next/static/$1" },
    { src: "/_next/data/(.*)", dest: "/_next/data/$1" },
    { src: "/api/(.*)", dest: "/api/$1" },
    { src: "/(.*)", dest: "/$1" },
  ],
};
