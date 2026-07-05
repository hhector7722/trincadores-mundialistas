import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "savsnkgpvvmdbaujqqoa.supabase.co",
        pathname: "/storage/v1/object/public/stickers/**",
      },
      {
        protocol: "https",
        hostname: "savsnkgpvvmdbaujqqoa.supabase.co",
        pathname: "/storage/v1/object/public/avatars/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
