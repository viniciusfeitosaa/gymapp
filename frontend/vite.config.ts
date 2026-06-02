import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Landing na raiz em dev (espelha nginx de produção). */
function landingAtRoot(): Plugin {
  return {
    name: 'landing-at-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url ?? '/'
        const q = raw.indexOf('?')
        const pathname = q >= 0 ? raw.slice(0, q) : raw
        const qs = q >= 0 ? raw.slice(q) : ''

        if (
          pathname === '/landing/index.html' ||
          pathname === '/landing' ||
          pathname === '/landing/'
        ) {
          res.writeHead(301, { Location: `/${qs}` })
          res.end()
          return
        }

        if (pathname === '/' || pathname === '') {
          req.url = `/landing/index.html${qs}`
        }

        next()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), landingAtRoot()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})
