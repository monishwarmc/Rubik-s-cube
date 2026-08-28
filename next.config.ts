import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins:['*'],
  transpilePackages:['three']
};

export default nextConfig;
