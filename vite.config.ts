import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@marketing": fileURLToPath(new URL("./src/app/marketing", import.meta.url)),
      "@portal": fileURLToPath(new URL("./src/app/portal", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@test": fileURLToPath(new URL("./src/test", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          icons: ["lucide-react"],
          motion: ["motion"],
        },
      },
    },
  },
});
