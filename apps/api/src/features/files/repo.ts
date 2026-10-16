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

export const createFile = async (db: D1Database, value: FileInput) => {
	const now = new Date().toISOString();
	try {
		const [created] = await db.batch<FileRow>([
			db
				.prepare(
					`INSERT INTO files (id, slug, file_name, object_key, content_type, size, public_url, created_at, updated_at)
					VALUES (COALESCE((SELECT id FROM files WHERE object_key = ?), ?), ?, ?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT(object_key) DO UPDATE SET
						slug = excluded.slug, file_name = excluded.file_name, content_type = excluded.content_type,
						size = excluded.size, public_url = excluded.public_url,
						updated_at = CASE WHEN files.slug = excluded.slug AND files.file_name = excluded.file_name
							AND files.content_type = excluded.content_type AND files.size = excluded.size
							AND files.public_url = excluded.public_url THEN files.updated_at ELSE ? END
					RETURNING *`,
				)
				.bind(
					value.objectKey,
					value.id,
					value.slug,
					value.fileName,
					value.objectKey,
					value.contentType,
					value.size,
					value.publicUrl,
					value.createdAt,
					value.createdAt,
					now,
				),
			db
				.prepare(
					"INSERT INTO short_links (slug, target_url, source, file_id, created_at, updated_at) SELECT slug, public_url, 'file', id, created_at, updated_at FROM files WHERE object_key = ? ON CONFLICT(file_id) DO UPDATE SET slug = excluded.slug, target_url = excluded.target_url, updated_at = excluded.updated_at WHERE short_links.source = 'file'",
				)
				.bind(value.objectKey),
		]);
		return mapFile(created.results[0]);
	} catch (error) {
		if (
			!(error instanceof Error) ||
			!error.message.includes("UNIQUE constraint failed")
		)
			throw error;
		throw new ApiError(
			409,
			"이미 사용 중인 파일 ID, slug 또는 objectKey입니다.",
		);
	}
};

export const updateFile = async (
	db: D1Database,
	id: string,
	value: Pick<FileInput, "slug" | "fileName"> &
		Partial<Pick<FileInput, "objectKey" | "publicUrl">>,
) => {
	const now = new Date().toISOString();
	try {
		const [updated] = await db.batch<FileRow>([
			db
				.prepare(
					"UPDATE files SET slug = ?, file_name = ?, object_key = COALESCE(?, object_key), public_url = COALESCE(?, public_url), updated_at = ? WHERE id = ? RETURNING *",
				)
				.bind(
					value.slug,
					value.fileName,
					value.objectKey ?? null,
					value.publicUrl ?? null,
					now,
					id,
				),
			db
				.prepare(
					"INSERT INTO short_links (slug, target_url, source, file_id, created_at, updated_at) SELECT slug, public_url, 'file', id, created_at, updated_at FROM files WHERE id = ? ON CONFLICT(file_id) DO UPDATE SET slug = excluded.slug, target_url = excluded.target_url, updated_at = excluded.updated_at WHERE short_links.source = 'file'",
				)
				.bind(id),
		]);
		if (!updated.results[0]) throw new ApiError(404, "File not found");
		return mapFile(updated.results[0]);
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("UNIQUE constraint failed")
		)
			throw new ApiError(409, "이미 사용 중인 slug 또는 objectKey입니다.");
		throw error;
	}
};

export const deleteFile = async (
	db: D1Database,
	id: string,
	objectKey: string,
) => {
	const [, deleted] = await db.batch<FileRow>([
		db
			.prepare(
				"DELETE FROM short_links WHERE source = 'file' AND file_id IN (SELECT id FROM files WHERE id = ? AND object_key = ?)",
			)
			.bind(id, objectKey),
		db
			.prepare("DELETE FROM files WHERE id = ? AND object_key = ? RETURNING *")
			.bind(id, objectKey),
	]);
	if (!deleted.results[0]) throw new ApiError(404, "File not found");
	return mapFile(deleted.results[0]);
};
