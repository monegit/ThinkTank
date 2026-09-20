import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";

const aliases = {
  react: resolve(__dirname, "node_modules/react"),
  "react-dom": resolve(__dirname, "node_modules/react-dom"),
  "react-native": resolve(__dirname, "node_modules/react-native-web"),
  "react-native-web": resolve(__dirname, "node_modules/react-native-web"),
  "react-native-css-interop": resolve(
    __dirname,
    "node_modules/react-native-css-interop",
  ),
  "react-native-safe-area-context": resolve(
    __dirname,
    "src/renderer/src/safe-area-context.web.tsx",
  ),
  nativewind: resolve(__dirname, "node_modules/nativewind"),
};

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve(__dirname, "src/main.ts") } },
    },
  },
  preload: {
    build: {
      rollupOptions: { input: { index: resolve(__dirname, "src/preload.ts") } },
    },
  },
  renderer: {
    resolve: {
      alias: aliases,
      dedupe: [
        "react",
        "react-dom",
        "react-native-web",
        "nativewind",
        "react-native-css-interop",
      ],
    },
    plugins: [react({ jsxImportSource: "nativewind" })],
  },
});
