import {
	fileObjectKeySchema,
	fileMappingDeleteSchema,
	fileSlugSchema,
	fileDeleteSchema,
	fileSchema,
	fileSigningSchema,
	fileUpdateSchema,
	fileUploadSchema,
	folderPrefixSchema,
	linkSchema,
	objectKeySchema,
	signedFileUploadSchema,
} from "@suk/contracts";
import { describe, expect, it } from "vitest";

describe("S3 object and mapping contracts", () => {
	it.each([
		"resume.pdf",
		"legacy/nested/한글 이름.pdf",
		"files/id/file.txt",
		"assets/cover.png",
		"folder/name?#%.txt",
	])("accepts root, nested, and portfolio file keys: %s", (key) => {
		expect(objectKeySchema.parse(key)).toBe(key);
		expect(fileObjectKeySchema.parse(key)).toBe(key);
	});

	it.each(["folder/", "assets/", "nested/folder/"])(
		"accepts folder markers for inventory but excludes them from file operations: %s",
		(key) => {
			expect(objectKeySchema.parse(key)).toBe(key);
			expect(folderPrefixSchema.parse(key)).toBe(key);
			expect(fileObjectKeySchema.safeParse(key).success).toBe(false);
		},
	);

	it("accepts the bucket root only as a folder prefix", () => {
		expect(folderPrefixSchema.parse("")).toBe("");
		expect(objectKeySchema.safeParse("").success).toBe(false);
		expect(fileObjectKeySchema.safeParse("").success).toBe(false);
		expect(folderPrefixSchema.safeParse("folder").success).toBe(false);
	});

	it.each([
		"",
		"/root.txt",
		"folder/../file",
		"folder/./file",
		"./file",
		".",
		"..",
		"folder/..",
		"folder\u0000/file",
		"folder\n/file",
		"folder\u007f/file",
		"bad\ud800.txt",
		"bad\udc00.txt",
		"한".repeat(342),
	])(
		"excludes invalid, normalized, control-character, or oversized keys: %j",
		(key) => {
			expect(objectKeySchema.safeParse(key).success).toBe(false);
			expect(fileObjectKeySchema.safeParse(key).success).toBe(false);
		},
	);

	it("measures the S3 key limit in UTF-8 bytes", () => {
		expect(fileObjectKeySchema.parse("a".repeat(1024))).toHaveLength(1024);
		expect(fileObjectKeySchema.safeParse("a".repeat(1025)).success).toBe(false);
		expect(fileObjectKeySchema.parse("한".repeat(341) + "a")).toBe(
			"한".repeat(341) + "a",
		);
	});

	it("keeps the full legacy file snapshot contract, including migration IDs and old keys", () => {
		const value = {
			id: "ssfs-legacy-id",
			slug: "resume",
			fileName: "resume.pdf",
			objectKey: "legacy/../resume.pdf",
			contentType: "",
			size: 0,
			publicUrl: "https://files.example.com/resume.pdf",
			createdAt: "2025-01-02T03:04:05.000Z",
		};
		expect(fileSchema.parse(value)).toEqual(value);
		expect(fileSchema.shape.objectKey.parse(value.objectKey)).toBe(
			value.objectKey,
		);
		expect(fileObjectKeySchema.safeParse(value.objectKey).success).toBe(false);
	});

	it("allows slug and filename edits and requires a key and public URL together for moves", () => {
		const edit = { slug: "resume", fileName: "resume.pdf" };
		const move = {
			...edit,
			objectKey: "assets/resume.pdf",
			publicUrl: "https://files.example.com/assets/resume.pdf",
		};
		expect(fileUpdateSchema.parse(edit)).toEqual(edit);
		expect(fileUpdateSchema.parse(move)).toEqual(move);
		expect(
			fileUpdateSchema.safeParse({ ...edit, objectKey: move.objectKey })
				.success,
		).toBe(false);
		expect(
			fileUpdateSchema.safeParse({ ...edit, publicUrl: move.publicUrl })
				.success,
		).toBe(false);
		expect(
			fileUpdateSchema.safeParse({ ...move, publicUrl: "invalid" }).success,
		).toBe(false);
		expect(
			fileUpdateSchema.safeParse({ ...move, objectKey: "assets/" }).success,
		).toBe(false);
	});

	it.each([
		".",
		"..",
		"path\\name",
		"admin",
		"API",
		"_next",
		"icon.png",
		"ip",
		"work",
	])("rejects normalized and reserved mapping slugs: %s", (slug) => {
		expect(linkSchema.shape.slug.safeParse(slug).success).toBe(false);
		expect(
			fileUpdateSchema.safeParse({ slug, fileName: "file.txt" }).success,
		).toBe(false);
	});

	it("signs arbitrary file keys without registering a mapping or generating an ID", () => {
		const value = {
			objectKey: "assets/cover.png",
			contentType: "image/png",
			size: 10,
		};
		expect(fileSigningSchema).toBe(fileUploadSchema);
		expect(
			fileSigningSchema.parse({
				...value,
				id: "ignored",
				slug: "ignored",
				fileName: "ignored",
			}),
		).toEqual({ ...value, overwrite: false });
		expect(
			fileSigningSchema.parse({
				...value,
				overwrite: true,
				confirmation: "assets/cover.png",
			}),
		).toEqual({ ...value, overwrite: true, confirmation: "assets/cover.png" });
	});

	it("allows zero-byte and untyped uploads, and rejects oversized single PUTs and invalid keys", () => {
		const value = { objectKey: "empty", contentType: "", size: 0 };
		expect(fileUploadSchema.parse(value)).toEqual({
			...value,
			overwrite: false,
		});
		expect(
			fileUploadSchema.safeParse({ ...value, size: 5 * 1024 ** 3 }).success,
		).toBe(true);
		for (const size of [-1, 0.5, 5 * 1024 ** 3 + 1])
			expect(fileUploadSchema.safeParse({ ...value, size }).success).toBe(
				false,
			);
		for (const objectKey of ["folder/", "./file", "/file"])
			expect(fileUploadSchema.safeParse({ ...value, objectKey }).success).toBe(
				false,
			);
		expect(
			fileUploadSchema.safeParse({ ...value, overwrite: "true" }).success,
		).toBe(false);
	});

	it("removes mappings by explicit stable ID and retains raw legacy keys only in the Worker guard", () => {
		expect(
			fileSlugSchema.parse({
				id: "legacy",
				slug: null,
				objectKey: "legacy/../resume.pdf",
			}),
		).toEqual({ id: "legacy", slug: null });
		expect(fileSlugSchema.safeParse({ slug: null }).success).toBe(false);
		expect(
			fileSlugSchema.safeParse({
				objectKey: "legacy/../resume.pdf",
				slug: null,
			}).success,
		).toBe(false);
		expect(
			fileMappingDeleteSchema.parse({ objectKey: "legacy/../resume.pdf" }),
		).toEqual({ objectKey: "legacy/../resume.pdf" });
	});
	it("requires reviewed object identities, ETags, and sizes rather than only counts", () => {
		expect(
			fileDeleteSchema.safeParse({ objectKey: "folder/", expectedCount: 1 })
				.success,
		).toBe(false);
		const objects = [
			{ objectKey: "folder/file.txt", etag: '"original"', size: 3 },
		];
		expect(fileDeleteSchema.parse({ objectKey: "folder/", objects })).toEqual({
			objectKey: "folder/",
			objects,
		});
		expect(
			fileDeleteSchema.safeParse({
				objectKey: "folder/",
				objects: [{ ...objects[0], etag: "" }],
			}).success,
		).toBe(false);
		expect(
			fileUploadSchema.parse({
				objectKey: "file.txt",
				size: 3,
				contentType: "text/plain",
				overwrite: true,
				etag: '"reviewed"',
			}),
		).toMatchObject({ etag: '"reviewed"' });
	});

	it("requires signed upload headers and returns no mapping identity or slug", () => {
		const value = {
			objectKey: "assets/cover.png",
			contentType: "image/png",
			uploadUrl: "https://files.example.com/assets/cover.png?signature=example",
			expiresAt: 1_800_000_000,
			headers: { "Content-Type": "image/png", "If-None-Match": "*" },
		};
		expect(
			signedFileUploadSchema.parse({
				...value,
				id: "ignored",
				slug: "ignored",
			}),
		).toEqual(value);
		expect(
			signedFileUploadSchema.safeParse({ ...value, headers: undefined })
				.success,
		).toBe(false);
		expect(
			signedFileUploadSchema.safeParse({ ...value, headers: { size: 10 } })
				.success,
		).toBe(false);
		expect(
			signedFileUploadSchema.safeParse({ ...value, headers: {} }).success,
		).toBe(true);
	});
});
