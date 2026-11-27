// Crash reports and usage counts, through Sentry's browser SDK for React (MIT), from the production site alone
// (PRIVACY.md):
//
// - a session per page load, which the SDK makes with a random ID and keeps for that page alone;
// - errors, with where in the code they happened;
// - a `download` transaction for each edited save downloaded, the app's one "run".
//
// Nothing about the save is sent: not its name, its bytes, its slot or its Hard Mode bit. A browser that sends Do Not
// Track or Global Privacy Control gets none of it.
import * as Sentry from '@sentry/react'

// ml4webedit's project in Sentry, made by regulad/homelab's tofu/sentry: VITE_SENTRY_DSN, which homelab's tofu/vercel
// sets from tofu/sentry's output and Vite writes in at build time, or the same DSN by default. A DSN only lets a client
// send events, so it is no secret.
const dsn =
  import.meta.env.VITE_SENTRY_DSN ||
  'https://81fe0d5b619b92d3b544e39aee7c69a2@o4506961510596608.ingest.us.sentry.io/4512500406353920'

// Header and query parameter names that carry client addresses.
const addressTerms = ['forwarded', '-ip', 'remote-', 'via', '-user']

// Unset, v11's dataCollection collects user info, cookies, headers and bodies, so every category is set. These follow
// regulad/doppelganger's apps/web/sentry.data-collection.ts, the baseline of Sentry's v10-to-v11 migration guide, with
// v11's newer categories off too.
const dataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: addressTerms },
    response: { deny: addressTerms },
  },
  httpBodies: [],
  urlQueryParams: { deny: addressTerms },
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
} satisfies NonNullable<Parameters<typeof Sentry.init>[0]>['dataCollection']

// Do Not Track and Global Privacy Control, the browser's two ways of asking not to be tracked.
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true
}

/** Starts diagnostics, on the production site, unless the browser asks not to be tracked. */
export function startDiagnostics(): void {
  if (!__SENTRY_ENABLED__ || optedOut()) return
  Sentry.init({
    dsn,
    // The release, the deployed commit, comes from @sentry/vite-plugin (vite.config.ts).
    environment: 'production',
    // Every download is counted: its transaction is the usage metric.
    tracesSampleRate: 1,
    dataCollection,
  })
}

/** Counts one run: an edited save downloaded. */
export function countDownload<T>(download: () => T): T {
  return Sentry.startSpan({ name: 'download', op: 'run' }, download)
}

/** createRoot's error hooks, which report what React catches. */
export const rootErrorHooks = {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}
