import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import type { TeleprompterState } from '#shared/types/teleprompter'
import { createDefaultState } from './session'

interface SessionRow {
  room_code: string
  script_markdown: string
  render_mode: 'markdown'
  font_size: number
  line_spacing: number
  speed_wpm: number
  playback_mode: 'auto' | 'step'
  is_playing: number
  step_index: number
  mirror: number
  theme: 'light' | 'dark' | 'system'
  controllers: number
  displays: number
  updated_at: string
  created_at: string
}

let db: Database.Database | null = null

function getDatabasePath(): string {
  const dataDir = path.join(process.cwd(), '.data')
  fs.mkdirSync(dataDir, { recursive: true })
  return path.join(dataDir, 'teleprompter.db')
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDatabasePath())
    db.pragma('journal_mode = WAL')
    migrate(db)
  }

  return db
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      room_code TEXT PRIMARY KEY,
      script_markdown TEXT NOT NULL,
      render_mode TEXT NOT NULL,
      font_size INTEGER NOT NULL,
      line_spacing REAL NOT NULL,
      speed_wpm INTEGER NOT NULL,
      playback_mode TEXT NOT NULL,
      is_playing INTEGER NOT NULL,
      step_index INTEGER NOT NULL,
      mirror INTEGER NOT NULL,
      theme TEXT NOT NULL,
      controllers INTEGER NOT NULL DEFAULT 0,
      displays INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);
  `)
}

export function upsertSession(state: TeleprompterState): void {
  getDb()
    .prepare(
      `
      INSERT INTO sessions (
        room_code, script_markdown, render_mode, font_size, line_spacing,
        speed_wpm, playback_mode, is_playing, step_index, mirror, theme,
        controllers, displays, created_at, updated_at
      ) VALUES (
        @roomCode, @scriptMarkdown, @renderMode, @fontSize, @lineSpacing,
        @speedWpm, @playbackMode, @isPlaying, @stepIndex, @mirror, @theme,
        @controllers, @displays, @createdAt, @updatedAt
      )
      ON CONFLICT(room_code) DO UPDATE SET
        script_markdown=excluded.script_markdown,
        render_mode=excluded.render_mode,
        font_size=excluded.font_size,
        line_spacing=excluded.line_spacing,
        speed_wpm=excluded.speed_wpm,
        playback_mode=excluded.playback_mode,
        is_playing=excluded.is_playing,
        step_index=excluded.step_index,
        mirror=excluded.mirror,
        theme=excluded.theme,
        controllers=excluded.controllers,
        displays=excluded.displays,
        updated_at=excluded.updated_at
      `
    )
    .run({
      roomCode: state.roomCode,
      scriptMarkdown: state.scriptMarkdown,
      renderMode: state.renderMode,
      fontSize: state.display.fontSize,
      lineSpacing: state.display.lineSpacing,
      speedWpm: state.playback.speedWpm,
      playbackMode: state.playback.mode,
      isPlaying: state.playback.isPlaying ? 1 : 0,
      stepIndex: state.playback.stepIndex,
      mirror: state.display.mirror ? 1 : 0,
      theme: state.display.theme,
      controllers: state.presence.controllers,
      displays: state.presence.displays,
      createdAt: state.updatedAt,
      updatedAt: state.updatedAt
    })
}

export function getSessionByCode(roomCode: string): TeleprompterState | null {
  const row = getDb()
    .prepare('SELECT * FROM sessions WHERE room_code = ?')
    .get(roomCode) as SessionRow | undefined

  if (!row) {
    return null
  }

  return mapRowToState(row)
}

export function getOrCreateSession(roomCode: string): TeleprompterState {
  const existing = getSessionByCode(roomCode)
  if (existing) {
    return existing
  }

  const state = createDefaultState(roomCode)
  upsertSession(state)
  return state
}

export function touchSession(roomCode: string): void {
  getDb()
    .prepare('UPDATE sessions SET updated_at = ? WHERE room_code = ?')
    .run(new Date().toISOString(), roomCode)
}

export function cleanupStaleSessions(hours = 48): number {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
  const info = getDb()
    .prepare('DELETE FROM sessions WHERE updated_at < ?')
    .run(cutoff)

  return info.changes
}

function mapRowToState(row: SessionRow): TeleprompterState {
  return {
    roomCode: row.room_code,
    scriptMarkdown: row.script_markdown,
    renderMode: row.render_mode,
    playback: {
      mode: row.playback_mode,
      speedWpm: row.speed_wpm,
      isPlaying: Boolean(row.is_playing),
      stepIndex: row.step_index
    },
    display: {
      fontSize: row.font_size,
      lineSpacing: row.line_spacing,
      mirror: Boolean(row.mirror),
      theme: row.theme
    },
    presence: {
      controllers: row.controllers,
      displays: row.displays
    },
    updatedAt: row.updated_at
  }
}
