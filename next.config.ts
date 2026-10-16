import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["*.localhost", "localhost"],
  experimental: {
    proxyClientMaxBodySize: "25mb",
    serverActions: {
      bodySizeLimit: "4mb",
      allowedOrigins: [
        "localhost:3000",
        "*.localhost:3000",
        "localhost:3007",
        "*.localhost:3007",
        "localhost:3008",
        "*.localhost:3008",
      ],
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
