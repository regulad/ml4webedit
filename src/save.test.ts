import { describe, expect, it } from 'vitest'
import { SAVE_SIZE, isHardMode, slotIndex, validateSave, withHardMode } from './save.ts'

function makeSave(byte1: number, slotByte = 0x01): Uint8Array {
  const bytes = new Uint8Array(SAVE_SIZE)
  bytes[0x01] = byte1
  bytes[0x11a4] = slotByte
  return bytes
}

describe('validateSave', () => {
  it('accepts a slot-sized file', () => {
    expect(validateSave(new Uint8Array(SAVE_SIZE))).toBeNull()
  })

  it('points out the 8-byte system file', () => {
    expect(validateSave(new Uint8Array(8))).toMatch(/ML4_000\.sav/)
  })

  it('rejects other sizes', () => {
    expect(validateSave(new Uint8Array(1234))).toMatch(/Expected/)
  })
})

describe('hard mode bit', () => {
  it('reads bit 0x02 of byte 0x01', () => {
    expect(isHardMode(makeSave(0x00))).toBe(false)
    expect(isHardMode(makeSave(0x02))).toBe(true)
    expect(isHardMode(makeSave(0xfd))).toBe(false)
  })

  it('sets and clears only that bit, preserving the ability bits that share the byte', () => {
    const on = withHardMode(makeSave(0xfc), true)
    expect(on[0x01]).toBe(0xfe)
    const off = withHardMode(makeSave(0xfe), false)
    expect(off[0x01]).toBe(0xfc)
  })

  it('leaves every other byte alone and does not mutate the input', () => {
    const original = makeSave(0x00)
    original[0x1234] = 0x55
    const edited = withHardMode(original, true)
    expect(original[0x01]).toBe(0x00)
    const changed = edited.reduce((n, b, i) => n + (b !== original[i] ? 1 : 0), 0)
    expect(changed).toBe(1)
  })
})

describe('slotIndex', () => {
  it('reads bits 3-4 of byte 0x11a4', () => {
    expect(slotIndex(makeSave(0, 0x01))).toBe(0)
    expect(slotIndex(makeSave(0, 0x09))).toBe(1)
  })
})
