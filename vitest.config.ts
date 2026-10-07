import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
  resolve: {
    // Mirror the "@/*" → "./*" path alias from tsconfig.json
    alias: {
      "@": resolve(__dirname, "."),
      "@eatobiotics/vocabulary": resolve(__dirname, "packages/vocabulary/src/index.ts"),
      "@eatobiotics/contracts": resolve(__dirname, "packages/contracts/src/index.ts"),
      "@eatobiotics/claims": resolve(__dirname, "packages/claims/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
