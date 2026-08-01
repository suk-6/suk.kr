PRAGMA foreign_keys = ON;

CREATE TABLE site_settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	name TEXT NOT NULL,
	title TEXT NOT NULL,
	intro TEXT NOT NULL,
	email TEXT NOT NULL,
	location TEXT NOT NULL DEFAULT '',
	resume_url TEXT NOT NULL DEFAULT '',
	github_url TEXT NOT NULL DEFAULT '',
	linkedin_url TEXT NOT NULL DEFAULT '',
	available_for TEXT NOT NULL DEFAULT '',
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	subtitle TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL,
	cover_url TEXT NOT NULL DEFAULT '',
	project_url TEXT NOT NULL DEFAULT '',
	repo_url TEXT NOT NULL DEFAULT '',
	tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
	highlights TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(highlights)),
	sort_order INTEGER NOT NULL DEFAULT 0,
	visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE timeline_entries (
	id TEXT PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('experience', 'education', 'award', 'activity', 'certificate')),
	title TEXT NOT NULL,
	organization TEXT NOT NULL DEFAULT '',
	start_date TEXT NOT NULL DEFAULT '',
	end_date TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	url TEXT NOT NULL DEFAULT '',
	sort_order INTEGER NOT NULL DEFAULT 0,
	visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	group_name TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE files (
	id TEXT PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	file_name TEXT NOT NULL,
	object_key TEXT NOT NULL UNIQUE,
	content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
	size INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
	public_url TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE short_links (
	slug TEXT PRIMARY KEY,
	target_url TEXT NOT NULL,
	password_hash TEXT,
	source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'file')),
	file_id TEXT UNIQUE REFERENCES files(id),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CHECK ((source = 'file' AND file_id IS NOT NULL) OR (source = 'manual' AND file_id IS NULL))
);

CREATE INDEX idx_projects_visible_order ON projects(visible, sort_order);
CREATE INDEX idx_entries_kind_visible_order ON timeline_entries(kind, visible, sort_order);
CREATE INDEX idx_skills_group_order ON skills(group_name, sort_order);
CREATE INDEX idx_links_source ON short_links(source);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

PRAGMA optimize;
