import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";

import sitemap from "@astrojs/sitemap";

const normalizeSiteUrl = (value) => {
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.endsWith("/") ? withProtocol : `${withProtocol}/`;
};

const siteUrl =
  normalizeSiteUrl(process.env.SITE_URL) ||
  normalizeSiteUrl(process.env.DEPLOY_PRIME_URL) ||
  normalizeSiteUrl(process.env.URL) ||
  "http://localhost:4321/";

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  integrations: [
    tailwind(),
    icon(),
    sitemap(),
  ],
});
