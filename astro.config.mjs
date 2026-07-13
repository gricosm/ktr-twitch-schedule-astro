// astro.config.mjs
import { defineConfig, envField } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  env: {
    schema: {
      TWITCH_CLIENT_ID: envField.string({ context: "server", access: "secret" }),
      TWITCH_CLIENT_SECRET: envField.string({ context: "server", access: "secret" }),
    },
  },
});