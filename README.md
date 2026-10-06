# Dream Team Hard Mode Toggle

A small React app that turns Hard Mode on or off in an existing *Mario & Luigi: Dream Team* (3DS) save. Everything runs in the browser; the save never leaves the page.

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

Import the repository in Vercel (or run `npx vercel` here). It detects Vite automatically: build command `npm run build`, output directory `dist`. No extra configuration is needed.
