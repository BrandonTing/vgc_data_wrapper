import { fileURLToPath } from "node:url";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const wrapperSourceEntry = fileURLToPath(
  new URL("../../packages/vgc_data_wrapper/src/index.ts", import.meta.url),
);

export default defineConfig(({ command }) => ({
  plugins: [sveltekit()],
  // Keep local package edits live in development while production builds verify
  // the published workspace contract through vgc_data_wrapper/dist/index.js.
  resolve: command === "serve"
    ? {
        alias: {
          vgc_data_wrapper: wrapperSourceEntry,
        },
      }
    : undefined,
}));
