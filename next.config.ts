import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs reads/writes the price spreadsheets in the admin panel; keep it out of the bundle.
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      // Banner and product photos are uploaded through Server Actions.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
