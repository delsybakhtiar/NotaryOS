import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview panel
  allowedDevOrigins: ["preview-chat-b2f1f5dd-443f-4f7a-94c7-9a524237b2d7.space-z.ai"],
};

export default nextConfig;
