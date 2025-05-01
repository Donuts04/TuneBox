import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["i1.sndcdn.com", "cdn-images.dzcdn.net"],
  },
};

export default nextConfig;
