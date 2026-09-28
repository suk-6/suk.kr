import type { Note, NoteListItem } from "@suk/contracts";

type NoteRow = {
	id: string;
	content: string;
	password_hash: string | null;
	created_at: string;
	updated_at: string;
};

export const getNotes = async (db: D1Database): Promise<NoteListItem[]> => {
	const { results } = await db
		.prepare(
			"SELECT id, LENGTH(CAST(content AS BLOB)) AS size, password_hash IS NOT NULL AS locked, updated_at AS updatedAt FROM notes ORDER BY updated_at DESC",
		)
		.all<{ id: string; size: number; locked: number; updatedAt: string }>();
	return results.map(({ id, size, locked, updatedAt }) => ({
		id,
		size,
		locked: Boolean(locked),
		updatedAt,
	}));
};

export const getNote = async (
	db: D1Database,
	id: string,
): Promise<Note | null> => {
	const row = await db
		.prepare("SELECT * FROM notes WHERE id = ?")
		.bind(id)
		.first<NoteRow>();
	return row
		? {
				id: row.id,
				content: row.content,
				passwordHash: row.password_hash,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
			}
		: null;
};

export const saveNote = async (db: D1Database, id: string, content: string) => {
	const now = new Date().toISOString();
	await db
		.prepare(
			"INSERT INTO notes (id, content, password_hash, created_at, updated_at) VALUES (?, ?, NULL, ?, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at",
		)
		.bind(id, content, now, now)
		.run();
	return getNote(db, id);
};

export const setNotePassword = async (
	db: D1Database,
	id: string,
	passwordHash: string | null,
) => {
	const now = new Date().toISOString();
	await db
		.prepare(
			"INSERT INTO notes (id, content, password_hash, created_at, updated_at) VALUES (?, '', ?, ?, ?) ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at",
		)
		.bind(id, passwordHash, now, now)
		.run();
	return getNote(db, id);
};

export const deleteNote = async (db: D1Database, id: string) => {
	await db.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();
};
