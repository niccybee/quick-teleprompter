export type SessionRole = 'controller' | 'display'
export type RenderMode = 'markdown'
export type PlaybackMode = 'auto' | 'step'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface PlaybackState {
  mode: PlaybackMode
  speedWpm: number
  isPlaying: boolean
  stepIndex: number
}

export interface DisplayState {
  fontSize: number
  lineSpacing: number
  mirror: boolean
  theme: ThemeMode
}

export interface PresenceState {
  controllers: number
  displays: number
}

export interface TeleprompterState {
  roomCode: string
  scriptMarkdown: string
  renderMode: RenderMode
  playback: PlaybackState
  display: DisplayState
  presence: PresenceState
  updatedAt: string
}

export interface SessionJoinPayload {
  roomCode: string
  role: SessionRole
}

export interface ScriptUpdatePayload {
  markdown: string
  renderMode: RenderMode
}

export interface PlaybackUpdatePayload {
  mode?: PlaybackMode
  speedWpm?: number
  isPlaying?: boolean
  stepIndex?: number
}

export interface DisplayUpdatePayload {
  fontSize?: number
  lineSpacing?: number
  mirror?: boolean
  theme?: ThemeMode
}

export interface PlaybackStepPayload {
  direction: 'next' | 'prev'
}

export interface SessionHeartbeatPayload {
  roomCode: string
  role: SessionRole
}

export interface ServerToClientEvents {
  'session:state': (state: TeleprompterState) => void
  'session:presence': (presence: PresenceState) => void
  'session:error': (message: string) => void
}

export interface ClientToServerEvents {
  'session:join': (payload: SessionJoinPayload) => void
  'script:update': (payload: ScriptUpdatePayload) => void
  'playback:update': (payload: PlaybackUpdatePayload) => void
  'display:update': (payload: DisplayUpdatePayload) => void
  'playback:step': (payload: PlaybackStepPayload) => void
  'session:heartbeat': (payload: SessionHeartbeatPayload) => void
}
