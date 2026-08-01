import type { FileInput } from "@suk/contracts";
import { ApiError } from "../../shared/error";
import { type FileRow, mapFile } from "../../shared/map";

export const getFiles = async (db: D1Database) => {
	const { results } = await db
		.prepare("SELECT * FROM files ORDER BY created_at DESC")
		.all<FileRow>();
	return results.map(mapFile);
};

export const getFile = async (db: D1Database, id: string) => {
	const row = await db
		.prepare("SELECT * FROM files WHERE id = ?")
		.bind(id)
		.first<FileRow>();
	return row ? mapFile(row) : null;
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

export const updateFile = async (
	db: D1Database,
	id: string,
	slug: string,
	fileName: string,
) => {
	const current = await getFile(db, id);
	if (!current) throw new ApiError(404, "File not found");
	const collision = await db
		.prepare(
			"SELECT slug FROM short_links WHERE slug = ? AND (file_id IS NULL OR file_id != ?)",
		)
		.bind(slug, id)
		.first("slug");
	if (collision) throw new ApiError(409, "이미 사용 중인 slug입니다.");
	const now = new Date().toISOString();
	await db.batch([
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
	return { ...current, slug, fileName, updatedAt: now };
};

export const deleteFile = async (db: D1Database, id: string) => {
	const current = await getFile(db, id);
	if (!current) throw new ApiError(404, "File not found");
	await db.batch([
		db
			.prepare("DELETE FROM short_links WHERE file_id = ? AND source = 'file'")
			.bind(id),
		db.prepare("DELETE FROM files WHERE id = ?").bind(id),
	]);
	return current;
};
