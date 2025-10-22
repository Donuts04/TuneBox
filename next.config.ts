import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  assetPrefix: process.env.NODE_ENV === "production" ? "/projects/tunebox" : "",
  images: {
    domains: [
      "i1.sndcdn.com",
      "cdn-images.dzcdn.net",
      "storage.googleapis.com",
    ],
  },
};

export default nextConfig;
