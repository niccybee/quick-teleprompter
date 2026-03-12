import { describe, expect, it } from 'vitest'
import {
  applyStepIndex,
  clampDisplay,
  clampPlayback,
  isValidRoomCode,
  randomRoomCode
} from '../server/utils/session'
import { normalizeGoogleDocUrl } from '../server/utils/google-docs'
import { renderMarkdown } from '../server/utils/markdown'

describe('session helpers', () => {
  it('generates valid room codes', () => {
    const code = randomRoomCode()
    expect(isValidRoomCode(code)).toBe(true)
  })

  it('validates room code format', () => {
    expect(isValidRoomCode('ABCDEF')).toBe(true)
    expect(isValidRoomCode('ab12cd')).toBe(false)
    expect(isValidRoomCode('ABCDE')).toBe(false)
  })

  it('clamps playback state', () => {
    const state = clampPlayback(
      { mode: 'auto', speedWpm: 100, isPlaying: true, stepIndex: 2, scrollProgress: 0.5 },
      { speedWpm: 1000, stepIndex: -1, mode: 'step', scrollProgress: 2 }
    )

    expect(state.mode).toBe('step')
    expect(state.isPlaying).toBe(false)
    expect(state.speedWpm).toBe(600)
    expect(state.stepIndex).toBe(0)
    expect(state.scrollProgress).toBe(1)
  })

  it('clamps display state', () => {
    const state = clampDisplay(
      { fontSize: 40, lineSpacing: 1.5, mirror: false, theme: 'dark' },
      { fontSize: 1, lineSpacing: 10, mirror: true, theme: 'light' }
    )

    expect(state.fontSize).toBe(20)
    expect(state.lineSpacing).toBe(3)
    expect(state.mirror).toBe(true)
    expect(state.theme).toBe('light')
  })

  it('steps index deterministically', () => {
    expect(applyStepIndex('next', 2)).toBe(3)
    expect(applyStepIndex('prev', 0)).toBe(0)
    expect(applyStepIndex('prev', 5)).toBe(4)
  })
})

describe('google docs normalization', () => {
  it('normalizes share links to txt export URL', () => {
    expect(
      normalizeGoogleDocUrl('https://docs.google.com/document/d/abc-123_DEF/edit?usp=sharing')
    ).toBe('https://docs.google.com/document/d/abc-123_DEF/export?format=txt')
  })
})

describe('markdown sanitization', () => {
  it('removes script tags from rendered html', () => {
    const html = renderMarkdown('# Hello\n<script>alert(1)</script>')
    expect(html).toContain('<h1>')
    expect(html).not.toContain('<script>')
  })
})
