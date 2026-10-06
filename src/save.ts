// Mario & Luigi: Dream Team slot save (data:/ML4_001.sav = slot 0, ML4_002.sav = slot 1).
//
// Hard Mode is a single bit: save byte 0x01, mask 0x02 (save variable 0xe009, bit 9 of
// the first word). The game's New Game routine sets only this bit when Hard is chosen,
// and the file has no checksum, so flipping it is all that's needed.

export const SAVE_SIZE = 0x179b0
const SYSTEM_FILE_SIZE = 8
const FLAGS_OFFSET = 0x01
const HARD_MODE_BIT = 0x02
const SLOT_OFFSET = 0x11a4

/** Returns a human-readable reason the bytes aren't a slot save, or null if they are. */
export function validateSave(bytes: Uint8Array): string | null {
  if (bytes.length === SYSTEM_FILE_SIZE) {
    return "That's ML4_000.sav, the game's system file. Use ML4_001.sav or ML4_002.sav instead."
  }
  if (bytes.length !== SAVE_SIZE) {
    return `Expected a ${SAVE_SIZE.toLocaleString()}-byte Dream Team slot save, but this file is ${bytes.length.toLocaleString()} bytes.`
  }
  return null
}

export function isHardMode(bytes: Uint8Array): boolean {
  return (bytes[FLAGS_OFFSET] & HARD_MODE_BIT) !== 0
}

/** Returns a copy of the save with Hard Mode set as requested; every other byte is untouched. */
export function withHardMode(bytes: Uint8Array, on: boolean): Uint8Array<ArrayBuffer> {
  const out = bytes.slice()
  out[FLAGS_OFFSET] = on ? out[FLAGS_OFFSET] | HARD_MODE_BIT : out[FLAGS_OFFSET] & ~HARD_MODE_BIT
  return out
}

/** In-game slot index (0 or 1) the save was created in. */
export function slotIndex(bytes: Uint8Array): number {
  return (bytes[SLOT_OFFSET] >> 3) & 3
}
