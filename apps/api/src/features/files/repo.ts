import type { FileInput } from "@suk/contracts";
import { type FileRow, mapFile } from "../../shared/map";

export const getFiles = async (db: D1Database) => {
	const { results } = await db
		.prepare("SELECT * FROM files ORDER BY created_at DESC")
		.all<FileRow>();
	return results.map(mapFile);
};

export const createFile = (db: D1Database, value: FileInput) =>
	db.batch([
		db
			.prepare(
				"INSERT INTO files (id, slug, file_name, object_key, content_type, size, public_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			)
			.bind(
				value.id,
				value.slug,
				value.fileName,
				value.objectKey,
				value.contentType,
				value.size,
				value.publicUrl,
				value.createdAt,
				value.createdAt,
			),
		db
			.prepare(
				"INSERT INTO short_links (slug, target_url, source, file_id, created_at, updated_at) VALUES (?, ?, 'file', ?, ?, ?)",
			)
			.bind(
				value.slug,
				value.publicUrl,
				value.id,
				value.createdAt,
				value.createdAt,
			),
	]);

export const updateFile = (
	db: D1Database,
	id: string,
	slug: string,
	fileName: string,
) => {
	const now = new Date().toISOString();
	return db.batch([
		db
			.prepare(
				"UPDATE short_links SET slug = ?, updated_at = ? WHERE file_id = ?",
			)
			.bind(slug, now, id),
		db
			.prepare(
				"UPDATE files SET slug = ?, file_name = ?, updated_at = ? WHERE id = ?",
			)
			.bind(slug, fileName, now, id),
	]);
};

export const deleteFile = (db: D1Database, id: string) =>
	db.batch([
		db
			.prepare("DELETE FROM short_links WHERE file_id = ? AND source = 'file'")
			.bind(id),
		db.prepare("DELETE FROM files WHERE id = ?").bind(id),
	]);
