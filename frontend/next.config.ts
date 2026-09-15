import type { NextConfig } from "next";

let targetBackend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
if (!targetBackend.startsWith("http://") && !targetBackend.startsWith("https://")) {
  targetBackend = `https://${targetBackend}`;
}
targetBackend = targetBackend.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${targetBackend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
