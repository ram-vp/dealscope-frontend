import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

// The repo declared `"lint": "eslint ."` from the start but never had eslint
// or a config installed, so the script always exited "command not found" --
// a lint step that could not fail was being read as a lint step that passed.
// This is the minimum that makes it real: Next's own flat configs
// (core-web-vitals covers the a11y/perf rules Next cares about, plus the
// TypeScript preset), scoped to source and skipping build output and the
// bundled data JSON.
//
// Imported natively rather than through @eslint/eslintrc's FlatCompat:
// eslint-config-next 16 ships real flat configs, and routing them through
// FlatCompat throws "Converting circular structure to JSON" on its react
// plugin self-reference.
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "data/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
]

export default config
