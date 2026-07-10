import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import videosHandler from './api/videos.js'

// Runs api/videos.js inside the Vite dev server so `npm run dev` alone is
// enough to test the app locally. Vercel handles this file as a real
// serverless function in production; here it's just called directly.
function apiDevMiddleware() {
  return {
    name: 'reelmatch-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/videos', async (req, res) => {
        const { searchParams } = new URL(req.url, 'http://localhost')
        const query = Object.fromEntries(searchParams)
        await videosHandler(
          { query },
          {
            status(code) {
              res.statusCode = code
              return this
            },
            json(body) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(body))
            },
          }
        )
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.PEXELS_API_KEY = env.PEXELS_API_KEY

  return {
    plugins: [react(), apiDevMiddleware()],
  }
})
