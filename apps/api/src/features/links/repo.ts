import type { LinkInput } from "@suk/contracts";
import { ApiError } from "../../shared/error";
import { type LinkRow, mapLink } from "../../shared/map";

export const getLinks = async (db: D1Database) => {
	const { results } = await db
		.prepare("SELECT * FROM short_links ORDER BY created_at DESC")
		.all<LinkRow>();
	return results.map(mapLink);
};

export const getLink = async (db: D1Database, slug: string) => {
	const row = await db
		.prepare("SELECT * FROM short_links WHERE slug = ?")
		.bind(slug)
		.first<LinkRow>();
	return row ? mapLink(row) : null;
};

export const saveLink = async (
	db: D1Database,
	value: LinkInput,
	previousSlug: string,
) => {
	const current = await getLink(db, previousSlug);
	if (current?.source === "file")
		throw new ApiError(409, "File links are read-only here");
	if (!current && previousSlug !== value.slug)
		throw new ApiError(404, "Short link not found");
	if (previousSlug !== value.slug && (await getLink(db, value.slug)))
		throw new ApiError(409, "이미 사용 중인 slug입니다.");
	const now = new Date().toISOString();
	if (current && previousSlug !== value.slug) {
		return db.batch([
			db
				.prepare("DELETE FROM short_links WHERE slug = ? AND source = 'manual'")
				.bind(previousSlug),
			db
				.prepare(
					"INSERT INTO short_links (slug, target_url, password_hash, source, created_at, updated_at) VALUES (?, ?, ?, 'manual', ?, ?)",
				)
				.bind(
					value.slug,
					value.targetUrl,
					value.passwordHash,
					current.createdAt,
					now,
				),
		]);
	}
	return current
		? db
				.prepare(
					"UPDATE short_links SET target_url = ?, password_hash = ?, updated_at = ? WHERE slug = ? AND source = 'manual'",
				)
				.bind(value.targetUrl, value.passwordHash, now, value.slug)
				.run()
		: db
				.prepare(
					"INSERT INTO short_links (slug, target_url, password_hash, source, created_at, updated_at) VALUES (?, ?, ?, 'manual', ?, ?)",
				)
				.bind(value.slug, value.targetUrl, value.passwordHash, now, now)
				.run();
};

export const deleteLink = async (db: D1Database, slug: string) => {
	const current = await getLink(db, slug);
	if (!current) throw new ApiError(404, "Short link not found");
	if (current.source === "file")
		throw new ApiError(409, "Managed links are read-only");
	return db
		.prepare("DELETE FROM short_links WHERE slug = ? AND source = 'manual'")
		.bind(slug)
		.run();
};
