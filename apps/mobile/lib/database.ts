import type { SQLiteDatabase } from 'expo-sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clips (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  session_id TEXT,
  label TEXT,
  recorded_at TEXT,
  file_uri TEXT,
  upload_status TEXT DEFAULT 'local',
  upload_progress INTEGER DEFAULT 0,
  mux_playback_id TEXT,
  move_name TEXT,
  style TEXT,
  energy TEXT,
  difficulty TEXT,
  bpm INTEGER,
  notes TEXT
);
`;

const MIGRATION_20260318_SESSION_ID_NULLABLE = `
BEGIN;
ALTER TABLE clips RENAME TO clips_old;
CREATE TABLE clips (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  session_id TEXT,
  label TEXT,
  recorded_at TEXT,
  file_uri TEXT,
  upload_status TEXT DEFAULT 'local',
  upload_progress INTEGER DEFAULT 0,
  mux_playback_id TEXT,
  move_name TEXT,
  style TEXT,
  energy TEXT,
  difficulty TEXT,
  bpm INTEGER,
  notes TEXT
);
INSERT INTO clips (
  local_id, server_id, session_id, label, recorded_at, file_uri,
  upload_status, upload_progress, mux_playback_id,
  move_name, style, energy, difficulty, bpm, notes
)
SELECT
  local_id, server_id, session_id, label, recorded_at, file_uri,
  upload_status, upload_progress, mux_playback_id,
  move_name, style, energy, difficulty, bpm, notes
FROM clips_old;
DROP TABLE clips_old;
COMMIT;
`;

let _db: SQLiteDatabase | null = null;
let _dbError: Error | null = null;
let _dbInitialized = false;

function initDb(): SQLiteDatabase | null {
  if (_dbInitialized) return _db;
  _dbInitialized = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { openDatabaseSync } = require('expo-sqlite') as typeof import('expo-sqlite');
    _db = openDatabaseSync('roam.db');
    _db.execSync('SELECT 1');
    _db.execSync(SCHEMA);

    // One-time migration: allow inbox clips (session_id nullable)
    try {
      const info = _db.getAllSync<{ name: string; notnull: number }>('PRAGMA table_info(clips)');
      const sessionCol = info?.find?.((c) => c.name === 'session_id');
      if (sessionCol && sessionCol.notnull === 1) {
        _db.execSync(MIGRATION_20260318_SESSION_ID_NULLABLE);
      }
    } catch {
      // If PRAGMA/migration fails, keep DB usable for session clips.
    }

    console.log('[database] SQLite initialised');
  } catch (e) {
    _dbError = e instanceof Error ? e : new Error(String(e));
    console.error('[database] SQLite init failed — local clip storage unavailable:', _dbError.message);
    _db = null;
  }
  return _db;
}

/** Returns the SQLite database, or null if native module is unavailable. */
export function getDb(): SQLiteDatabase | null {
  return initDb();
}

/** @deprecated Direct export kept for call-site compat; prefer getDb(). */
export const db = new Proxy({} as SQLiteDatabase, {
  get(_target, prop) {
    const real = initDb();
    if (!real) {
      if (prop === 'runSync' || prop === 'execSync' || prop === 'getAllSync') {
        return () => {
          console.warn(`[database] db.${String(prop)} called but SQLite is unavailable`);
          if (prop === 'getAllSync') return [];
        };
      }
      return undefined;
    }
    const val = (real as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as Function).bind(real) : val;
  },
});

export interface ClipRow {
  local_id: string;
  server_id: string | null;
  session_id: string | null;
  label: string | null;
  recorded_at: string | null;
  file_uri: string | null;
  upload_status: string;
  upload_progress: number;
  mux_playback_id: string | null;
  move_name: string | null;
  style: string | null;
  energy: string | null;
  difficulty: string | null;
  bpm: number | null;
  notes: string | null;
}

export interface InsertClipRow {
  local_id: string;
  session_id: string | null;
  label?: string | null;
  recorded_at?: string | null;
  file_uri?: string | null;
  upload_status?: string;
  upload_progress?: number;
  server_id?: string | null;
  mux_playback_id?: string | null;
  move_name?: string | null;
  style?: string | null;
  energy?: string | null;
  difficulty?: string | null;
  bpm?: number | null;
  notes?: string | null;
}

export interface ClipTags {
  move_name?: string | null;
  style?: string | null;
  energy?: string | null;
  difficulty?: string | null;
  bpm?: number | null;
  notes?: string | null;
}

export function insertClip(row: InsertClipRow): void {
  db.runSync(
    `INSERT INTO clips (
      local_id, session_id, label, recorded_at, file_uri,
      upload_status, upload_progress, server_id, mux_playback_id,
      move_name, style, energy, difficulty, bpm, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.local_id,
      row.session_id,
      row.label ?? null,
      row.recorded_at ?? null,
      row.file_uri ?? null,
      row.upload_status ?? 'local',
      row.upload_progress ?? 0,
      row.server_id ?? null,
      row.mux_playback_id ?? null,
      row.move_name ?? null,
      row.style ?? null,
      row.energy ?? null,
      row.difficulty ?? null,
      row.bpm ?? null,
      row.notes ?? null,
    ]
  );
}

export function updateClipStatus(
  local_id: string,
  status: string,
  progress?: number
): void {
  if (progress !== undefined) {
    db.runSync(
      'UPDATE clips SET upload_status = ?, upload_progress = ? WHERE local_id = ?',
      [status, progress, local_id]
    );
  } else {
    db.runSync('UPDATE clips SET upload_status = ? WHERE local_id = ?', [
      status,
      local_id,
    ]);
  }
}

export function updateClipServerData(
  local_id: string,
  server_id: string,
  mux_playback_id?: string | null
): void {
  if (mux_playback_id != null) {
    db.runSync(
      'UPDATE clips SET server_id = ?, mux_playback_id = ? WHERE local_id = ?',
      [server_id, mux_playback_id, local_id]
    );
  } else {
    db.runSync('UPDATE clips SET server_id = ? WHERE local_id = ?', [
      server_id,
      local_id,
    ]);
  }
}

export interface ClipServerUpdate {
  server_id?: string;
  upload_status?: string;
  mux_playback_id?: string | null;
  move_name?: string | null;
  style?: string | null;
  energy?: string | null;
  difficulty?: string | null;
  bpm?: number | null;
  notes?: string | null;
}

/** Persist server-driven clip fields to SQLite so state survives app restart */
export function updateClipFromServer(
  local_id: string,
  update: ClipServerUpdate
): void {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  if (update.server_id !== undefined) {
    setClauses.push('server_id = ?');
    values.push(update.server_id);
  }
  if (update.upload_status !== undefined) {
    setClauses.push('upload_status = ?');
    values.push(update.upload_status);
  }
  if (update.mux_playback_id !== undefined) {
    setClauses.push('mux_playback_id = ?');
    values.push(update.mux_playback_id);
  }
  if (update.move_name !== undefined) {
    setClauses.push('move_name = ?');
    values.push(update.move_name);
  }
  if (update.style !== undefined) {
    setClauses.push('style = ?');
    values.push(update.style);
  }
  if (update.energy !== undefined) {
    setClauses.push('energy = ?');
    values.push(update.energy);
  }
  if (update.difficulty !== undefined) {
    setClauses.push('difficulty = ?');
    values.push(update.difficulty);
  }
  if (update.bpm !== undefined) {
    setClauses.push('bpm = ?');
    values.push(update.bpm);
  }
  if (update.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(update.notes);
  }
  if (setClauses.length === 0) return;
  values.push(local_id);
  db.runSync(
    `UPDATE clips SET ${setClauses.join(', ')} WHERE local_id = ?`,
    values
  );
}

export function updateClipTags(local_id: string, tags: ClipTags): void {
  db.runSync(
    `UPDATE clips SET
      move_name = ?, style = ?, energy = ?, difficulty = ?, bpm = ?, notes = ?
    WHERE local_id = ?`,
    [
      tags.move_name ?? null,
      tags.style ?? null,
      tags.energy ?? null,
      tags.difficulty ?? null,
      tags.bpm ?? null,
      tags.notes ?? null,
      local_id,
    ]
  );
}

export function getClipsForSession(session_id: string): ClipRow[] {
  const rows = db.getAllSync<ClipRow>(
    'SELECT * FROM clips WHERE session_id = ? ORDER BY recorded_at DESC',
    [session_id]
  );
  return rows;
}

export function assignLocalClipToSessionByServerId(server_id: string, session_id: string): void {
  db.runSync('UPDATE clips SET session_id = ? WHERE server_id = ?', [session_id, server_id]);
}

/** Returns all local clips with no session assignment (inbox clips). */
export function getInboxClips(): ClipRow[] {
  const rows = db.getAllSync<ClipRow>(
    'SELECT * FROM clips WHERE session_id IS NULL ORDER BY recorded_at DESC',
    []
  );
  return rows ?? [];
}
