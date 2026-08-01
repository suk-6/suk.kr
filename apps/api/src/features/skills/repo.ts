import type { Skill } from "@suk/contracts";
import { mapSkill, type SkillRow } from "../../shared/map";

export const getSkills = async (db: D1Database) => {
	const { results } = await db
		.prepare("SELECT * FROM skills ORDER BY sort_order, name")
		.all<SkillRow>();
	return results.map(mapSkill);
};

export const saveSkill = (db: D1Database, value: Skill) =>
	db
		.prepare(`INSERT INTO skills (id, name, group_name, sort_order) VALUES (?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET name = excluded.name, group_name = excluded.group_name, sort_order = excluded.sort_order`)
		.bind(value.id, value.name, value.groupName, value.sortOrder)
		.run();

export const deleteSkill = (db: D1Database, id: string) =>
	db.prepare("DELETE FROM skills WHERE id = ?").bind(id).run();
