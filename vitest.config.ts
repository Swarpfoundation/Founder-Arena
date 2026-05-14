import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": resolve(__dirname, "./tests/unit/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
  },
});
