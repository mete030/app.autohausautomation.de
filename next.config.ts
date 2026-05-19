import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mercedes-benz.de',
      },
      {
        protocol: 'https',
        hostname: 'media.oneweb.mercedes-benz.com',
      },
    ],
  },
};

export default nextConfig;
