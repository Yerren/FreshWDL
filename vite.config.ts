import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        embed: 'embed.html',
      },
    },
  },
  server: {
    port: 4173,
  },
})
