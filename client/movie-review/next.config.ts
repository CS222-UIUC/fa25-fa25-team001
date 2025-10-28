import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Prevent ESLint from failing the build on Vercel due to warnings/errors in generated/vendor files
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
