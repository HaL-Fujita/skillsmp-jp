import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境向け設定
  output: 'standalone', // Vercel最適化

  // 画像最適化（必要に応じて）
  images: {
    unoptimized: true, // 外部画像が多い場合
  },

  // Reactの厳格モード
  reactStrictMode: true,
};

export default nextConfig;
