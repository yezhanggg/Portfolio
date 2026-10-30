import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://yezhang.ai",
  trailingSlash: "ignore",
  build: { format: "file" },
  integrations: [sitemap()],
});
