import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  /* ✔ относительные пути, чтобы Foundry искал файлы в modules/five-beat-timer/… */
  base: "./",

  publicDir: "public",           // module.json, timer-config.yml, .nojekyll → dist/

  build: {
    outDir: "dist",
    emptyOutDir: true,           // чистим старую сборку
    sourcemap: mode === "development",

    /* библиотечный режим: генерирует single-file bundle dist/main.js */
    lib: {
      entry: resolve("src/main.ts"),
      name: "FiveBeatTimer",
      formats: ["es"]            // ESM-скрипт, как ждёт Foundry
    },

    rollupOptions: {
      /* не включать ядро Foundry и PIXI в bundle */
      external: /^foundry\.|^pixi\.*/,
      output: {
        /* класть ассеты рядом, без подкаталога assets/ */
        assetFileNames: "[name][extname]"
      }
    }
  }
}));
