import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/community", destination: "/network", permanent: true }];
  },
};

export default nextConfig;
