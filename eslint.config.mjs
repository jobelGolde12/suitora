import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";
import noQueryInLoop from "./eslint-rules/no-query-in-loop.mjs";

const eslintConfig = defineConfig([
  // Flat config is authoritative (`.eslintrc.*` files are not loaded).
  // `npm run lint` runs `eslint .`, so new dirs/files are linted automatically
  // without glob maintenance; add anything that must NOT be linted here.
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "cypress/screenshots/**",
    "cypress/videos/**",
    "data/e2e-test.db",
  ]),
  // Query-quality enforcement (Pillar 03, Action Item 8).
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: { drizzle, "no-query-in-loop": { rules: { noQueryInLoop } } },
    rules: {
      "drizzle/enforce-update-with-where": "error",
      "drizzle/enforce-delete-with-where": "error",
      "no-query-in-loop/noQueryInLoop": "error",
    },
  },
]);

export default eslintConfig;
