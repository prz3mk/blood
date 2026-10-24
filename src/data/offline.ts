export const OFFLINE = {
  /** Base cap on offline progress; Night Endurance adds to it. */
  baseHours: 2,
  /** Offline is simulated in chunks of this many seconds... */
  chunkSeconds: 1,
  /** ...but at most this many chunks (long absences use bigger chunks). */
  maxChunks: 20_000,
  /** Gaps shorter than this are simulated silently (no report). */
  reportMinSeconds: 60,
} as const

export const AUTOSAVE_SECONDS = 30
