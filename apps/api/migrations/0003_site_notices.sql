CREATE TABLE site_notices (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	starts_at TEXT NOT NULL DEFAULT '',
	ends_at TEXT NOT NULL DEFAULT '',
	sort_order INTEGER NOT NULL DEFAULT 0,
	visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_site_notices_active_order
ON site_notices(visible, sort_order, starts_at, ends_at);
