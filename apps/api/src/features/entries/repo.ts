import type { Entry } from "@suk/contracts";
import { type EntryRow, mapEntry } from "../../shared/map";

export const getEntries = async (db: D1Database, includeHidden = false) => {
	const { results } = await db
		.prepare(
			`SELECT * FROM timeline_entries ${includeHidden ? "" : "WHERE visible = 1"} ORDER BY sort_order, start_date DESC`,
		)
		.all<EntryRow>();
	return results.map(mapEntry);
};

export const saveEntry = (db: D1Database, value: Entry) =>
	db
		.prepare(`INSERT INTO timeline_entries (id, kind, title, organization, start_date, end_date, description, url, sort_order, visible, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET kind = excluded.kind, title = excluded.title, organization = excluded.organization, start_date = excluded.start_date, end_date = excluded.end_date, description = excluded.description, url = excluded.url, sort_order = excluded.sort_order, visible = excluded.visible, updated_at = excluded.updated_at`)
		.bind(
			value.id,
			value.kind,
			value.title,
			value.organization,
			value.startDate,
			value.endDate,
			value.description,
			value.url,
			value.sortOrder,
			value.visible ? 1 : 0,
			new Date().toISOString(),
		)
		.run();

export const deleteEntry = (db: D1Database, id: string) =>
	db.prepare("DELETE FROM timeline_entries WHERE id = ?").bind(id).run();
