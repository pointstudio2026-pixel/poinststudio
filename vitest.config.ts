import "dotenv/config";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// AI provider keys must never be live during automated test runs -- tests
// rely on the AI Provider Router falling back to its Mock provider
// (deterministic, no network) regardless of what real keys a developer has
// in their local .env for manual testing. DB/Redis/storage config from
// .env is still needed (integration tests hit a real Postgres).
delete process.env.OPENAI_API_KEY;
delete process.env.GEMINI_API_KEY;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.TEXT_COMPLETION_PROVIDER;
delete process.env.IMAGE_GENERATION_PROVIDER;

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
