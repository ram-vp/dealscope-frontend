import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    // Component tests opt in to jsdom with a `// @vitest-environment jsdom` header.
    environment: "node",
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx"],
    testTimeout: 20_000,
  },
})
