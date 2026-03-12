import type {
  DisplayState,
  PlaybackState,
  PlaybackUpdatePayload,
  DisplayUpdatePayload,
  TeleprompterState,
  ThemeMode
} from '#shared/types/teleprompter'

const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const DEFAULT_PLAYBACK: PlaybackState = {
  mode: 'auto',
  speedWpm: 120,
  isPlaying: false,
  stepIndex: 0,
  scrollProgress: 0
}

export const DEFAULT_DISPLAY: DisplayState = {
  fontSize: 48,
  lineSpacing: 1.5,
  mirror: false,
  theme: 'dark'
}

export function createDefaultState(roomCode: string): TeleprompterState {
  return {
    roomCode,
    scriptMarkdown: '# New Script\n\nPaste or import text from the controller.',
    renderMode: 'markdown',
    playback: { ...DEFAULT_PLAYBACK },
    display: { ...DEFAULT_DISPLAY },
    presence: { controllers: 0, displays: 0 },
    updatedAt: new Date().toISOString()
  }
}

export function randomRoomCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z2-9]{6}$/.test(code)
}

export function clampPlayback(
  current: PlaybackState,
  updates: PlaybackUpdatePayload
): PlaybackState {
  const mode = updates.mode ?? current.mode
  const isPlaying = mode === 'auto' ? (updates.isPlaying ?? current.isPlaying) : false

  return {
    mode,
    isPlaying,
    speedWpm: clampNumber(updates.speedWpm ?? current.speedWpm, 20, 600),
    stepIndex: Math.max(0, Math.round(updates.stepIndex ?? current.stepIndex)),
    scrollProgress: clampNumber(updates.scrollProgress ?? current.scrollProgress, 0, 1)
  }
}

export function clampDisplay(
  current: DisplayState,
  updates: DisplayUpdatePayload
): DisplayState {
  return {
    fontSize: clampNumber(updates.fontSize ?? current.fontSize, 20, 120),
    lineSpacing: clampNumber(updates.lineSpacing ?? current.lineSpacing, 1, 3),
    mirror: updates.mirror ?? current.mirror,
    theme: normalizeTheme(updates.theme ?? current.theme)
  }
}

export function applyStepIndex(direction: 'next' | 'prev', stepIndex: number): number {
  if (direction === 'next') {
    return stepIndex + 1
  }

  return Math.max(0, stepIndex - 1)
}

function normalizeTheme(theme: ThemeMode): ThemeMode {
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme
  }

  return 'dark'
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
