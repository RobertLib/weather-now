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
};

export default nextConfig;
