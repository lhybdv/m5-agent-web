import path from "node:path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import Components from 'unplugin-vue-components/vite';
import { ArcoResolver } from 'unplugin-vue-components/resolvers';


// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    vueJsx(),
    visualizer({
      open: true, //在默认浏览器中打开生成的文件
      gzipSize: true, // 收集 gzip 大小并将其显示
      brotliSize: true, // 收集 brotli 大小并将其显示
      filename: "stats.html", // 分析图生成的文件名
    }),
    AutoImport({
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
      imports: ["vue"],
      dirs: ["./src"],
      resolvers: [ArcoResolver()],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true
        })
      ]
    })
  ],
  resolve: {
    alias: {
      "@view": path.resolve(__dirname, "./src/view"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("vue-devui")) {
              return "vue-devui";
            }
            if (id.includes("@matechat/core")) {
              return "matechat-core";
            }
            if (id.includes("mermaid")) {
              return "mermaid";
            }
            if (id.includes("monaco-editor")) {
              return "monaco-editor";
            }
          }
        },
      },
    },
  },
  server: {
    allowedHosts: ["localhost", "ai.weathermate.com.cn"],
  },
});
