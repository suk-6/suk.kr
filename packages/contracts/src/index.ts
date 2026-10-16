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

export const reservedSlugs: readonly string[] = [
	"_next",
	"admin",
	"api",
	"i",
	"icon.png",
	"ip",
	"note",
	"work",
];

export const noteIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
export const noteSchema = z.object({
	id: noteIdSchema,
	content: z.string(),
	passwordHash: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});
export const noteListItemSchema = noteSchema
	.pick({ id: true, updatedAt: true })
	.extend({ size: z.number().int().nonnegative(), locked: z.boolean() });
export const noteListSchema = z.array(noteListItemSchema);
export type Note = z.infer<typeof noteSchema>;
export type NoteListItem = z.infer<typeof noteListItemSchema>;

export const linkSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(160)
		.regex(/^[^/?#\\]+$/, "slug에 /, \\, ?, #을 사용할 수 없습니다.")
		.refine(
			(slug) => ![".", ".."].includes(slug),
			"점만 있는 slug는 사용할 수 없습니다.",
		)
		.refine(
			(slug) => !reservedSlugs.includes(slug.toLowerCase()),
			"애플리케이션에서 사용하는 예약어는 slug로 등록할 수 없습니다.",
		),
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

// S3 is the file inventory. D1 rows below are optional slug mappings;
// legacy metadata columns remain compatible snapshots, not the file inventory.
export const objectKeySchema = z
	.string()
	.min(1)
	.refine(
		(key) =>
			!/[\uD800-\uDFFF]/u.test(key) &&
			!key.startsWith("/") &&
			!key.split("/").some((part) => part === "." || part === "..") &&
			!/[\u0000-\u001f\u007f]/.test(key) &&
			new TextEncoder().encode(key).length <= 1024,
		"올바른 S3 키를 입력하세요. 점만 있는 경로와 제어 문자는 사용할 수 없습니다.",
	);
export const fileObjectKeySchema = objectKeySchema.refine(
	(key) => !key.endsWith("/"),
	"파일 키는 /로 끝날 수 없습니다.",
);
export const folderPrefixSchema = z.union([
	z.literal(""),
	objectKeySchema.refine(
		(key) => key.endsWith("/"),
		"폴더 경로는 /로 끝나야 합니다.",
	),
]);
export const fileUpdateSchema = fileSchema
	.pick({ slug: true, fileName: true })
	.extend({
		objectKey: fileObjectKeySchema.optional(),
		publicUrl: z.url().optional(),
	})
	.refine(
		(value) => Boolean(value.objectKey) === Boolean(value.publicUrl),
		"이동할 키와 공개 URL을 함께 입력하세요.",
	);
export const fileUploadSchema = z.object({
	objectKey: fileObjectKeySchema,
	contentType: fileSchema.shape.contentType,
	size: z
		.number()
		.int()
		.nonnegative()
		.max(5 * 1024 ** 3),
	overwrite: z.boolean().default(false),
	etag: z.string().min(1).optional(),
	confirmation: z.string().optional(),
});
export const fileSigningSchema = fileUploadSchema;
export const signedFileUploadSchema = z.object({
	objectKey: fileObjectKeySchema,
	expiresAt: z.number().int(),
	uploadUrl: z.url(),
	contentType: z.string().min(1),
	headers: z.record(z.string(), z.string()),
});
export const fileMappingDeleteSchema = z.object({
	objectKey: fileSchema.shape.objectKey,
});
export const fileSlugSchema = z.union([
	z.object({ id: z.string().min(1), slug: z.null() }),
	z.object({ objectKey: fileObjectKeySchema, slug: linkSchema.shape.slug }),
]);
export const reviewedObjectSchema = z.object({
	objectKey: z.string().min(1),
	etag: z.string().min(1),
	size: z.number().int().nonnegative(),
});
export const folderCreateSchema = z.object({
	prefix: folderPrefixSchema.refine(Boolean, "버킷 루트는 만들 수 없습니다."),
});
export const fileDeleteSchema = z.object({
	objectKey: objectKeySchema,
	objects: z.array(reviewedObjectSchema),
	confirmation: z.string().optional(),
});
export const fileMoveSchema = fileDeleteSchema
	.extend({ destinationKey: objectKeySchema })
	.refine(
		({ objectKey, destinationKey }) =>
			objectKey !== destinationKey &&
			objectKey.endsWith("/") === destinationKey.endsWith("/") &&
			!(objectKey.endsWith("/") && destinationKey.startsWith(objectKey)),
		"원본과 다른 경로를 입력하세요. 폴더는 /로 끝나야 하며 자신의 하위 폴더로 이동할 수 없습니다.",
	);
export const fileOperationPlanSchema = z.object({
	objects: z.array(reviewedObjectSchema),
	count: z.number().int().nonnegative(),
	bytes: z.number().int().nonnegative(),
	requiresConfirmation: z.boolean(),
});
export const storageObjectSchema = z.object({
	objectKey: z.string(),
	size: z.number().int().nonnegative(),
	lastModified: z.string().datetime().nullable(),
	contentType: z.string(),
	publicUrl: z.url(),
	mapping: fileSchema.extend({ updatedAt: z.string() }).nullable(),
});
export const storageObjectsSchema = z.object({
	prefix: z.string(),
	folders: z.array(z.string()),
	objects: z.array(storageObjectSchema),
	nextToken: z.string().nullable(),
});
export const fileScanOffsetSchema = z.coerce.number().int().nonnegative();
export const brokenFileLinksSchema = z.object({
	files: z.array(fileSchema.extend({ updatedAt: z.string() })),
	nextOffset: z.number().int().nullable(),
});
export type SignedFileUpload = z.infer<typeof signedFileUploadSchema>;
export type StorageObject = z.infer<typeof storageObjectSchema>;
export type StorageObjects = z.infer<typeof storageObjectsSchema>;
export type FileOperationPlan = z.infer<typeof fileOperationPlanSchema>;
export type BrokenFileLinks = z.infer<typeof brokenFileLinksSchema>;

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
