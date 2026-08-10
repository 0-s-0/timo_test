import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 手机用局域网 IP 访问 dev 时，需放行该 IP，否则客户端 JS/API 会异常
  allowedDevOrigins: [
    "192.168.12.20",
    ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ??
      []),
  ],
};

export default nextConfig;
