import type { NextConfig } from "next";
import { withReticle } from "@reticlehq/next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/community", destination: "/network", permanent: true }];
  },
};

// Dev-only source mapping for Reticle; no-op in production builds.
export default withReticle(nextConfig);
