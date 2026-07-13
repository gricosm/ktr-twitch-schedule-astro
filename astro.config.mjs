// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless"; // en Astro 4 la ruta lleva /serverless

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [tailwind()],
});