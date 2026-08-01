import type { Settings } from "@suk/contracts";
import { mapSettings, type SettingsRow } from "../../shared/map";

export const getSettings = async (db: D1Database) => {
	const row = await db
		.prepare("SELECT * FROM site_settings WHERE id = 1")
		.first<SettingsRow>();
	if (!row) throw new Error("Site settings not found");
	return mapSettings(row);
};

export const saveSettings = (db: D1Database, value: Settings) =>
	db
		.prepare(
			`UPDATE site_settings SET name = ?, title = ?, intro = ?, email = ?, location = ?, resume_url = ?, github_url = ?, linkedin_url = ?, available_for = ?, updated_at = ? WHERE id = 1`,
		)
		.bind(
			value.name,
			value.title,
			value.intro,
			value.email,
			value.location,
			value.resumeUrl,
			value.githubUrl,
			value.linkedinUrl,
			value.availableFor,
			new Date().toISOString(),
		)
		.run();
