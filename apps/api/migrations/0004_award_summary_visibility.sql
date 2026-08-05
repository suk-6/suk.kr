ALTER TABLE timeline_entries
ADD COLUMN summary_hidden INTEGER NOT NULL DEFAULT 0 CHECK (summary_hidden IN (0, 1));
