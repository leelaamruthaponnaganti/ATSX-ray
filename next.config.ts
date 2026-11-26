import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist + native canvas) and mammoth must stay outside the
  // server bundle so their dynamic requires keep working at runtime.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
