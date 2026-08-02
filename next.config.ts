import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The backend base URL and API key are read server-side only, inside the
  // proxy route handler. Nothing here is exposed to the browser bundle.
};

export default nextConfig;
