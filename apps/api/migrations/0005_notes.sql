CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  password_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
