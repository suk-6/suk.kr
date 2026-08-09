import { z } from "zod";

export const entryKinds = [
	"experience",
	"education",
	"award",
	"activity",
	"certificate",
] as const;
export const entryKind = z.enum(entryKinds);

export const settingsSchema = z.object({
	name: z.string().min(1).max(80),
	title: z.string().min(1).max(120),
	intro: z.string().min(1).max(1000),
	email: z.email(),
	location: z.string().max(120),
	resumeUrl: z.url().or(z.literal("")),
	githubUrl: z.url().or(z.literal("")),
	linkedinUrl: z.url().or(z.literal("")),
	availableFor: z.string().max(200),
});

export const projectSchema = z.object({
	id: z
		.string()
		.min(1)
		.default(() => crypto.randomUUID()),
	slug: z.string().min(1).max(100),
	name: z.string().min(1).max(160),
	organization: z.string().max(200),
	subtitle: z.string().max(240),
	description: z.string().min(1).max(3000),
	coverUrl: z.url().or(z.literal("")),
	projectUrl: z.url().or(z.literal("")),
	repoUrl: z.url().or(z.literal("")),
	tags: z.array(z.string().min(1).max(50)).max(20),
	highlights: z.array(z.string().min(1).max(500)).max(20),
	caseStudy: z
		.array(
			z.object({
				title: z.string().min(1).max(160),
				body: z.string().min(1).max(5000),
				imageUrl: z.url().or(z.literal("")).default(""),
				code: z.string().max(10000).default(""),
				codeLanguage: z.string().max(40).default(""),
			}),
		)
		.max(12)
		.default([]),
	sortOrder: z.number().int().min(0).max(9999),
	visible: z.boolean(),
});

export const entrySchema = z.object({
	id: z
		.string()
		.min(1)
		.default(() => crypto.randomUUID()),
	kind: entryKind,
	title: z.string().min(1).max(200),
	organization: z.string().max(200),
	startDate: z.string().max(20),
	endDate: z.string().max(20),
	description: z.string().max(3000),
	url: z.url().or(z.literal("")),
	sortOrder: z.number().int().min(0).max(9999),
	visible: z.boolean(),
	summaryHidden: z.boolean().default(false),
});

export const entryBatchSchema = z
	.object({
		upsert: z.array(entrySchema).max(100),
		remove: z.array(z.string().min(1)).max(100),
	})
	.refine(
		({ upsert, remove }) => !upsert.some(({ id }) => new Set(remove).has(id)),
		"같은 항목을 저장하고 삭제할 수 없습니다.",
	);

export const skillSchema = z.object({
	id: z
		.string()
		.min(1)
		.default(() => crypto.randomUUID()),
	name: z.string().min(1).max(80),
	groupName: z.string().min(1).max(80),
	sortOrder: z.number().int().min(0).max(9999),
});

export const noticeSchema = z
	.object({
		id: z
			.string()
			.min(1)
			.default(() => crypto.randomUUID()),
		title: z.string().min(1).max(160),
		content: z.string().min(1).max(2000),
		startsAt: z.string().datetime().or(z.literal("")),
		endsAt: z.string().datetime().or(z.literal("")),
		sortOrder: z.number().int().min(0).max(9999),
		visible: z.boolean(),
	})
	.refine(
		({ startsAt, endsAt }) => !startsAt || !endsAt || startsAt <= endsAt,
		{
			message: "종료 시각은 시작 시각보다 빠를 수 없습니다.",
			path: ["endsAt"],
		},
	);

export const linkSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(160)
		.regex(/^[^/?#]+$/, "slug에 /, ?, #을 사용할 수 없습니다."),
	targetUrl: z.url(),
	passwordHash: z.string().nullable().default(null),
});

export const fileSchema = z.object({
	id: z
		.string()
		.min(1)
		.default(() => crypto.randomUUID()),
	slug: linkSchema.shape.slug,
	fileName: z.string().min(1).max(500),
	objectKey: z.string().min(1).max(1024),
	contentType: z.string().max(200),
	size: z.number().int().nonnegative(),
	publicUrl: z.url(),
	createdAt: z.string().datetime(),
});

export const fileUpdateSchema = fileSchema.pick({ slug: true, fileName: true });

export type Settings = z.infer<typeof settingsSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type EntryBatch = z.infer<typeof entryBatchSchema>;
export type EntryKind = z.infer<typeof entryKind>;
export type Skill = z.infer<typeof skillSchema>;
export type SiteNotice = z.infer<typeof noticeSchema>;
export type LinkInput = z.infer<typeof linkSchema>;
export type FileInput = z.infer<typeof fileSchema>;

export type ShortLink = LinkInput & {
	source: "manual" | "file";
	fileId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type StoredFile = FileInput & { updatedAt: string };

export type Portfolio = {
	settings: Settings;
	projects: Project[];
	entries: Entry[];
	skills: Skill[];
	notices: SiteNotice[];
};
