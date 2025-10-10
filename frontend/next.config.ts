import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export
  output: 'export',

  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    domains: [],
    unoptimized: true, // Required for static export
  },

  // Remove server-only features for static export
  // serverExternalPackages: ["better-sqlite3"],
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: "2mb",
  //   },
  // },

  // No rewrites needed - FastAPI will handle routing
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: "http://192.168.2.93:3505/:path*",
  //     },
  //   ];
  // },
};

export default nextConfig;
