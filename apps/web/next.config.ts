import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "sw.js",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true
  }
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bluecup/types"]
};

export default withPWA(nextConfig);
