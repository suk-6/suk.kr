import type { SiteNotice } from "@suk/contracts";
import { mapNotice, type NoticeRow } from "../../shared/map";

export const getNotices = async (db: D1Database, includeInactive = false) => {
	const now = new Date().toISOString();
	const statement = db.prepare(
		`SELECT * FROM site_notices ${
			includeInactive
				? ""
				: "WHERE visible = 1 AND (starts_at = '' OR starts_at <= ?) AND (ends_at = '' OR ends_at >= ?)"
		} ORDER BY sort_order, created_at`,
	);
	const { results } = await (
		includeInactive ? statement : statement.bind(now, now)
	).all<NoticeRow>();
	return results.map(mapNotice);
};

export const saveNotice = (db: D1Database, value: SiteNotice) =>
	db
		.prepare(
			`INSERT INTO site_notices (id, title, content, starts_at, ends_at, sort_order, visible, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content, starts_at = excluded.starts_at, ends_at = excluded.ends_at, sort_order = excluded.sort_order, visible = excluded.visible, updated_at = excluded.updated_at`,
		)
		.bind(
			value.id,
			value.title,
			value.content,
			value.startsAt,
			value.endsAt,
			value.sortOrder,
			value.visible ? 1 : 0,
			new Date().toISOString(),
		)
		.run();

export const deleteNotice = (db: D1Database, id: string) =>
	db.prepare("DELETE FROM site_notices WHERE id = ?").bind(id).run();
