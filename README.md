# Dream Team Hard Mode Toggle

A small React app that turns Hard Mode on or off in an existing *Mario & Luigi: Dream Team* (3DS) save. Everything runs in the browser; the save never leaves the page.

## Privacy

The production site sends crash reports and a count of each save downloaded to Sentry, and nothing about the save itself; a browser that sends Do Not Track or Global Privacy Control sends nothing. [PRIVACY.md](PRIVACY.md) has the details. Local and preview builds send nothing (`vite.config.ts`, `src/diagnostics.ts`).

## How it works

Each slot save (`ML4_001.sav`, `ML4_002.sav`, 96,688 bytes) stores Hard Mode as one bit: byte `0x01`, mask `0x02`. The game's New Game routine sets only that bit when Hard is chosen, and the file has no checksum. The app flips that bit and leaves every other byte alone (see `src/save.ts`).

What changes in-game after turning it on:

- Items are capped at 10 each; a stack above 10 drops to 10 the next time its count changes.
- The badge meter fills at 80% of the normal amount.
- Saving a Hard Mode file sets a sticky "Hard Mode unlocked" bit in the system file `ML4_000.sav`, which the app doesn't touch.

## Development

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests for the save logic
npm run build   # type-check + production build into dist/
```

## Deploying to Vercel

Import the repository in Vercel (or run `npx vercel` here). Build settings are pinned in the repo rather than left to auto-detection: `vercel.json` sets the Vite preset, `npm ci` as the install command, `npm run build`, and `dist` as the output directory, and `engines.node` in `package.json` pins Node 24.x. These override whatever is set in the Vercel dashboard.

Production builds make a Sentry release named for the deployed commit and upload the build's source maps to it, then delete them from `dist`, with the `SENTRY_AUTH_TOKEN` that regulad/homelab sets on the Vercel project. `@sentry/react` and `@sentry/vite-plugin` follow Semantic Versioning: Sentry's maintainers guarantee public API stability within a major version (getsentry/sentry-javascript#10576), and its migration guides put breaking changes only in majors (checked 2026-11-26). So `package.json` takes any 11.x, and both stay at the same version, as the SDK expects of every Sentry package on a page.

## Versions

The version is the release date, `YYYY.M.D`, as the app exposes no API: `package.json`'s `version` is the date of the latest release.
