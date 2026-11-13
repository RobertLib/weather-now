import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ISR pages revalidate hourly. By default a stale page may be served for up
  // to a year while it regenerates in the background, so a rarely visited
  // "tomorrow" page could show a days-old forecast (and only the overview
  // refreshes itself in the browser). Past this age the page is regenerated
  // before it is served, both by Next's own cache and by CDNs honouring the
  // `stale-while-revalidate` header.
  expireTime: 2 * 3600,
  experimental: {
    // Two root layouts (English and Czech trees) need a routing-level 404.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only the location button needs a device API.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      {
        // Everything except the embeddable widget may only be framed by the
        // site itself (clickjacking protection).
        source: "/:path((?!embed/).*)",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
      },
    ];
  },
};

export default nextConfig;
