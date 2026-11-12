import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Two root layouts (English and Czech trees) need a routing-level 404.
    globalNotFound: true,
  },
};

export default nextConfig;
