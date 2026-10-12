import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? (githubPages ? "/mirage-casino" : "")).replace(/\/$/, "");

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(githubPages ? {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
  } : {}),
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: !githubPages,
  partialPrefetching: !githubPages,
  turbopack: {
    rules: {
      // Component CSS modules use Next's built-in loader to retain scoped exports.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
