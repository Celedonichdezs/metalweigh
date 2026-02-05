import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  compress: true,
};

export default nextConfig;
