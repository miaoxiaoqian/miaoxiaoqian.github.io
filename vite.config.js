import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        assetFileNames(assetInfo) {
          return assetInfo.names?.some((name) => name.endsWith(".css"))
            ? "styles.css"
            : "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
