import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  /* Every page in this app is session-gated and inherently dynamic
     (auth, kiosk, admin dashboard), so static/partial prerendering
     buys nothing here and only adds Suspense boilerplate. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
