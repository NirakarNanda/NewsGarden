import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy API calls to the backend so the browser never makes a
    // cross-origin request in dev. BACKEND_INTERNAL_URL is read when the
    // server starts; in docker compose it points at the backend service.
    const backend =
      process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
