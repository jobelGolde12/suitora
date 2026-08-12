import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "lib/**/*.test.ts",
      "scripts/**/*.test.ts",
      "jobs/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        "tests/**",
        "types/**",
        "data/**",
        "drizzle/**",
        "**/*.test.ts",
        "**/*.config.*",
      ],
      thresholds: {
        lines: 65,
        functions: 55,
        statements: 65,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
