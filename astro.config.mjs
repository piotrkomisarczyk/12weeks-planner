// @ts-check
import { defineConfig } from "astro/config";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// Get the mode from command line arguments (e.g., --mode test)
const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex !== -1 ? process.argv[modeIndex + 1] : "development";

// CRITICAL FIX: When a mode is specified, ONLY load that mode's .env file
// Do NOT load the base .env at all - this prevents conflicts with Cloudflare adapter
const envFile = mode === "production" ? ".env" : `.env.${mode}`;
const envPath = resolve(process.cwd(), envFile);

if (existsSync(envPath)) {
  // Clear any existing env vars that might have been loaded
  // Then load ONLY the mode-specific file
  const result = dotenv.config({ path: envPath, override: true });

  if (result.parsed) {
    // Force these values into process.env, overriding anything that was there
    Object.entries(result.parsed).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }
} else {
  dotenv.config({ override: true });
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    // Since we've already loaded the correct .env file with dotenv above,
    // Vite and Astro will use those values from process.env
    // Astro automatically handles PUBLIC_* prefixed variables
  },
  // Conditionally apply Cloudflare adapter
  // For test/prod modes, disable platformProxy which interferes with env loading
  adapter: cloudflare({
    platformProxy: {
      enabled: mode === "development",
    },
  }),
});
