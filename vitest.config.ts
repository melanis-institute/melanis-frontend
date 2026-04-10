import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      testTimeout: 15000,
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
      },
    },
  }),
);
