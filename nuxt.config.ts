import { nodePolyfills } from "@bangjelkoski/vite-plugin-node-polyfills";

export default defineNuxtConfig({
  ssr: false,
  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@nuxtjs/tailwindcss"],

  typescript: {
    typeCheck: "build",
  },

  imports: {
    dirs: ["composables/**", "store/**"],
  },

  pinia: {
    autoImports: ["defineStore"],
  },

  plugins: [{ src: "./plugins/buffer.client.ts", ssr: false }],

  sourcemap: {
    server: false,
    client: true,
  },

  vite: {
    define: {
      "process.env": JSON.stringify({}),
      "process.env.DEBUG": JSON.stringify(process.env.DEBUG),
    },

    plugins: [nodePolyfills({ protocolImports: false })],

    build: {
      sourcemap: false,

      rollupOptions: {
        cache: false,
        output: {
          manualChunks: (id: string) => {
            //
          },
        },
      },
    },

    optimizeDeps: {
      exclude: ["fsevents"],
    },
  },
});
