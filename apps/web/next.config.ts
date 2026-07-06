import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";

loadEnvConfig(path.resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@lendtrack/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/storage/v1/object/public/**" },
      { protocol: "http", hostname: "localhost", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
