/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 中 serverActions 默认开启，不再需要手动配置
  // 生产环境构建时跳过校验以加速部署
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;