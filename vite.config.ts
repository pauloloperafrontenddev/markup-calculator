import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isDockerDev = process.env.DOCKER_DEV === 'true'

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
      }
    }),
    viteReact(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
  ],

  server: {
    // Bind to all interfaces so Docker can expose the port outside the container
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,

    // Polling-based watch is more reliable for Docker bind mounts.
    // Disabled on host (inotify works fine there).
    watch: isDockerDev
      ? {
          usePolling: true,
          interval: 500,
        }
      : undefined,

    // When nginx proxies on port 80, HMR ws connects through the same origin.
    // No clientPort override needed — nginx handles the WebSocket upgrade.
    hmr: isDockerDev
      ? {
          host: 'localhost',
          clientPort: 80, // Browser talks to nginx:80, which proxies to app:3000
        }
      : undefined,
  },
})

export default config
