import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "store.storeimages.cdn-apple.com", pathname: "/**" },
      { protocol: "https", hostname: "**.apple.com", pathname: "/**" },
      { protocol: "https", hostname: "**.mzstatic.com", pathname: "/**" },
      { protocol: "https", hostname: "m.media-amazon.com", pathname: "/**" },
      { protocol: "https", hostname: "**.media-amazon.com", pathname: "/**" },
      { protocol: "https", hostname: "**.ssl-images-amazon.com", pathname: "/**" },
      { protocol: "https", hostname: "image.goat.com", pathname: "/**" },
      { protocol: "https", hostname: "static.nike.com", pathname: "/**" },
      { protocol: "https", hostname: "static.zara.net", pathname: "/**" },
      { protocol: "https", hostname: "cdn.simpleicons.org", pathname: "/**" },
    ],
  },
};

export default nextConfig;
