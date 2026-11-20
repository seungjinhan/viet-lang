import aitDevtools from "@apps-in-toss/devtools/unplugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `--mode web`은 GitHub Pages 웹 버전이에요. 하위 경로(/viet-lang/)에서도 열리게 상대 경로로 만들어요.
export default defineConfig(({ mode }) => ({
  base: mode === "web" ? "./" : "/",
  plugins: mode === "web" ? [react()] : [aitDevtools.vite(), react()],
  server: { port: 5193, strictPort: true },
  test: { exclude: ["node_modules", "dist", "dist-web"] },
})) as Parameters<typeof defineConfig>[0];
