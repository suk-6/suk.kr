import {
	projectSchema,
	type Entry,
	type Project,
	type Settings,
	type ShortLink,
	type Skill,
	type SiteNotice,
	type StoredFile,
} from "@suk/contracts";

type SettingsRow = {
	name: string;
	title: string;
	intro: string;
	email: string;
	location: string;
	resume_url: string;
	github_url: string;
	linkedin_url: string;
	available_for: string;
};

type ProjectRow = {
	id: string;
	slug: string;
	name: string;
	organization: string;
	subtitle: string;
	description: string;
	cover_url: string;
	project_url: string;
	repo_url: string;
	tags: string;
	highlights: string;
	case_study: string;
	sort_order: number;
	visible: number;
};

type EntryRow = {
	id: string;
	kind: Entry["kind"];
	title: string;
	organization: string;
	start_date: string;
	end_date: string;
	description: string;
	url: string;
	sort_order: number;
	visible: number;
	summary_hidden: number;
};

type SkillRow = {
	id: string;
	name: string;
	group_name: string;
	sort_order: number;
};

type NoticeRow = {
	id: string;
	title: string;
	content: string;
	starts_at: string;
	ends_at: string;
	sort_order: number;
	visible: number;
};

type LinkRow = {
	slug: string;
	target_url: string;
	password_hash: string | null;
	source: ShortLink["source"];
	file_id: string | null;
	created_at: string;
	updated_at: string;
};

type FileRow = {
	id: string;
	slug: string;
	file_name: string;
	object_key: string;
	content_type: string;
	size: number;
	public_url: string;
	created_at: string;
	updated_at: string;
};

export const mapSettings = (row: SettingsRow): Settings => ({
	name: row.name,
	title: row.title,
	intro: row.intro,
	email: row.email,
	location: row.location,
	resumeUrl: row.resume_url,
	githubUrl: row.github_url,
	linkedinUrl: row.linkedin_url,
	availableFor: row.available_for,
});

export const mapProject = (row: ProjectRow): Project => ({
	id: row.id,
	slug: row.slug,
	name: row.name,
	organization: row.organization,
	subtitle: row.subtitle,
	description: row.description,
	coverUrl: row.cover_url,
	projectUrl: row.project_url,
	repoUrl: row.repo_url,
	tags: JSON.parse(row.tags) as string[],
	highlights: JSON.parse(row.highlights) as string[],
	caseStudy: projectSchema.shape.caseStudy.parse(JSON.parse(row.case_study)),
	sortOrder: row.sort_order,
	visible: Boolean(row.visible),
});

export const mapEntry = (row: EntryRow): Entry => ({
	id: row.id,
	kind: row.kind,
	title: row.title,
	organization: row.organization,
	startDate: row.start_date,
	endDate: row.end_date,
	description: row.description,
	url: row.url,
	sortOrder: row.sort_order,
	visible: Boolean(row.visible),
	summaryHidden: Boolean(row.summary_hidden),
});

export const mapSkill = (row: SkillRow): Skill => ({
	id: row.id,
	name: row.name,
	groupName: row.group_name,
	sortOrder: row.sort_order,
});

export const mapNotice = (row: NoticeRow): SiteNotice => ({
	id: row.id,
	title: row.title,
	content: row.content,
	startsAt: row.starts_at,
	endsAt: row.ends_at,
	sortOrder: row.sort_order,
	visible: Boolean(row.visible),
});

export const mapLink = (row: LinkRow): ShortLink => ({
	slug: row.slug,
	targetUrl: row.target_url,
	passwordHash: row.password_hash,
	source: row.source,
	fileId: row.file_id,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export const mapFile = (row: FileRow): StoredFile => ({
	id: row.id,
	slug: row.slug,
	fileName: row.file_name,
	objectKey: row.object_key,
	contentType: row.content_type,
	size: row.size,
	publicUrl: row.public_url,
	createdAt: row.created_at,
	updatedAt: row.updated_at,
});

export type {
	EntryRow,
	FileRow,
	LinkRow,
	NoticeRow,
	ProjectRow,
	SettingsRow,
	SkillRow,
};
