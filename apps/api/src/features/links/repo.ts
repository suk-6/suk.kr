import type { LinkInput } from "@suk/contracts";
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
		throw new Error("File links are read-only here");
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
	return db
		.prepare(`INSERT INTO short_links (slug, target_url, password_hash, source, updated_at) VALUES (?, ?, ?, 'manual', ?)
		ON CONFLICT(slug) DO UPDATE SET target_url = excluded.target_url, password_hash = excluded.password_hash, updated_at = excluded.updated_at WHERE short_links.source = 'manual'`)
		.bind(value.slug, value.targetUrl, value.passwordHash, now)
		.run();
};

export const deleteLink = (db: D1Database, slug: string) =>
	db
		.prepare("DELETE FROM short_links WHERE slug = ? AND source = 'manual'")
		.bind(slug)
		.run();
