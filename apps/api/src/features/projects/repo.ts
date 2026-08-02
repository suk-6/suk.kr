import type { Project } from "@suk/contracts";
import { mapProject, type ProjectRow } from "../../shared/map";

export const getProjects = async (db: D1Database, includeHidden = false) => {
	const { results } = await db
		.prepare(
			`SELECT * FROM projects ${includeHidden ? "" : "WHERE visible = 1"} ORDER BY sort_order, name`,
		)
		.all<ProjectRow>();
	return results.map(mapProject);
};

export const saveProject = (db: D1Database, value: Project) =>
	db
		.prepare(
			`INSERT INTO projects (id, slug, name, organization, subtitle, description, cover_url, project_url, repo_url, tags, highlights, case_study, sort_order, visible, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, name = excluded.name, organization = excluded.organization, subtitle = excluded.subtitle, description = excluded.description, cover_url = excluded.cover_url, project_url = excluded.project_url, repo_url = excluded.repo_url, tags = excluded.tags, highlights = excluded.highlights, case_study = excluded.case_study, sort_order = excluded.sort_order, visible = excluded.visible, updated_at = excluded.updated_at`,
		)
		.bind(
			value.id,
			value.slug,
			value.name,
			value.organization,
			value.subtitle,
			value.description,
			value.coverUrl,
			value.projectUrl,
			value.repoUrl,
			JSON.stringify(value.tags),
			JSON.stringify(value.highlights),
			JSON.stringify(value.caseStudy),
			value.sortOrder,
			value.visible ? 1 : 0,
			new Date().toISOString(),
		)
		.run();

export const deleteProject = (db: D1Database, id: string) =>
	db.prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
