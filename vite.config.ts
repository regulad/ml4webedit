import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// Only Vercel's production builds report to Sentry and upload source maps to it (PRIVACY.md); local and preview
// builds do neither. Vercel sets VERCEL_ENV and VERCEL_GIT_COMMIT_SHA in every build, and SENTRY_AUTH_TOKEN, from
// regulad/homelab's tofu/vercel, in production builds alone. loadEnv reads them from the build's environment, by
// these prefixes, as from any .env file.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', ['VERCEL_', 'SENTRY_'])
  const production = env.VERCEL_ENV === 'production'
  return {
    define: {
      __SENTRY_ENABLED__: JSON.stringify(production),
    },
    build: {
      // In production, hidden source maps, which the plugin uploads, then deletes from dist, so that none is served.
      sourcemap: production ? 'hidden' : false,
    },
    plugins: [
      react(),
      sentryVitePlugin({
        disable: !production,
        org: 'regulad',
        project: 'ml4webedit',
        authToken: env.SENTRY_AUTH_TOKEN,
        // The release is the deployed commit.
        release: { name: env.VERCEL_GIT_COMMIT_SHA },
        sourcemaps: { delete: true },
        // The plugin's own usage reports to Sentry.
        telemetry: false,
      }),
    ],
  }
})
