import { defineConfig } from "vitest/config";

/**
 * Os testes usam o mesmo alias `@/` do resto do projeto — rodar teste por um
 * caminho diferente do da aplicação é pedir para testar um arquivo que não é o
 * que roda de verdade. O Vite resolve o alias direto do tsconfig.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["testes/**/*.test.ts"],
    environment: "node",
  },
});
