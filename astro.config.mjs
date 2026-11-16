import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://yezhang.ai",
  trailingSlash: "ignore",
  build: { format: "file" },
  integrations: [sitemap()],
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
});
