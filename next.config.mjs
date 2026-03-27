/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 强制忽略生产构建时的 ESLint 检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. 强制忽略 TypeScript 类型检查错误
  typescript: {
    ignoreBuildErrors: true,
  },
  // 3. (可选) 如果你用了特殊的图片来源，可以在这里配置
  images: {
    unoptimized: true,
  }
};

export default nextConfig;