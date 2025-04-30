import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import history from 'connect-history-api-fallback'

export default defineConfig({
  plugins: [react()],
  server: {
    historyApiFallback: true,
    setupMiddlewares(middlewares) {
      middlewares.unshift(history())
      return middlewares
    }
  }
})