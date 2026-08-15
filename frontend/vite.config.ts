import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(__dirname, "../");
  const env = loadEnv(mode, rootEnvDir, "");
  const backendPort = env.BACKEND_PORT || env.PORT || "3000";

  return {
    envDir: rootEnvDir,
    plugins: [reactRouter(), tsconfigPaths()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
