import type { FileInput, StoredFile } from "@suk/contracts";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app";
import { createFile, getFile, updateFile } from "../src/features/files/repo";
import { getLink } from "../src/features/links/repo";

const file = (overrides: Partial<FileInput> = {}): FileInput => ({
	id: "files-test-one",
	slug: "files-test-one.pdf",
	fileName: "파일 이름.pdf",
	objectKey: "files-test/one.pdf",
	contentType: "application/pdf",
	size: 42,
	publicUrl: "https://files.example.com/one.pdf",
	createdAt: "2025-01-02T03:04:05.000Z",
	...overrides,
});

const request = (path: string, method = "GET", body?: unknown) =>
	app.request(
		path,
		{
			method,
			headers: {
				authorization: `Bearer ${env.API_TOKEN}`,
				"content-type": "application/json",
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		},
		env,
	);

const manualLink = async (slug: string) => {
	const response = await request(`/links/${slug}`, "PUT", {
		slug,
		targetUrl: "https://example.com/manual",
		passwordHash: "manual-password-hash",
	});
	expect(response.status).toBe(200);
	return getLink(env.DB, slug);
};

afterEach(async () => {
	await env.DB.batch([
		env.DB.prepare(
			"DELETE FROM short_links WHERE slug LIKE 'files-test-%' OR file_id IN (SELECT id FROM files WHERE id LIKE 'files-test-%')",
		),
		env.DB.prepare("DELETE FROM files WHERE id LIKE 'files-test-%'"),
	]);
});

describe("file slug mappings", () => {
	it("atomically creates the mapping and owned link, and lists only stored mappings", async () => {
		const input = file();
		const response = await request("/files", "POST", input);
		expect(response.status).toBe(201);
		const stored = await response.json<StoredFile>();
		expect(stored).toEqual({ ...input, updatedAt: input.createdAt });
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getLink(env.DB, input.slug)).toEqual({
			slug: input.slug,
			targetUrl: input.publicUrl,
			passwordHash: null,
			source: "file",
			fileId: input.id,
			createdAt: input.createdAt,
			updatedAt: input.createdAt,
		});
		const fetched = await request(`/files/${input.id}`);
		expect(fetched.status).toBe(200);
		expect(await fetched.json()).toEqual(stored);
		const listed = await request("/files");
		expect(listed.status).toBe(200);
		expect(await listed.json()).toContainEqual(stored);
	});

	it("keeps the original ID, createdAt and updatedAt for an identical retry with a new ID", async () => {
		const input = file();
		await createFile(env.DB, input);
		const updatedAt = "2025-02-03T04:05:06.000Z";
		await env.DB.batch([
			env.DB.prepare("UPDATE files SET updated_at = ? WHERE id = ?").bind(
				updatedAt,
				input.id,
			),
			env.DB.prepare(
				"UPDATE short_links SET updated_at = ? WHERE file_id = ?",
			).bind(updatedAt, input.id),
		]);
		const link = await getLink(env.DB, input.slug);
		const response = await request("/files", "POST", {
			...input,
			id: "files-test-retry",
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ ...input, updatedAt });
		expect(await getFile(env.DB, input.id)).toEqual({ ...input, updatedAt });
		expect(await getFile(env.DB, "files-test-retry")).toBeNull();
		expect(await getLink(env.DB, input.slug)).toEqual(link);
	});

	it("upserts changed slug and metadata by key while preserving the mapping identity", async () => {
		const input = file();
		await createFile(env.DB, input);
		const candidate = file({
			id: "files-test-retry",
			slug: "files-test-renamed",
			fileName: "changed.txt",
			contentType: "text/plain",
			size: 123,
			publicUrl: "https://files.example.com/changed.txt",
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		const response = await request("/files", "POST", candidate);
		expect(response.status).toBe(201);
		const stored = await response.json<StoredFile>();
		expect(stored).toEqual({
			...candidate,
			id: input.id,
			createdAt: input.createdAt,
			updatedAt: expect.any(String),
		});
		expect(stored.updatedAt > input.createdAt).toBe(true);
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getFile(env.DB, candidate.id)).toBeNull();
		expect(await getLink(env.DB, input.slug)).toBeNull();
		expect(await getLink(env.DB, candidate.slug)).toMatchObject({
			fileId: input.id,
			targetUrl: candidate.publicUrl,
			createdAt: input.createdAt,
			updatedAt: stored.updatedAt,
		});
	});

	it.each(["resume.pdf", "legacy/nested/한글 이름.pdf", "assets/cover.png"])(
		"preserves migration IDs and snapshots for the existing key %s",
		async (objectKey) => {
			const input = file({
				id: "files-test-legacy-ssfs-id",
				objectKey,
				size: 0,
				contentType: "",
			});
			await createFile(env.DB, input);
			const response = await request("/files", "POST", {
				...input,
				id: "files-test-new",
				slug: "files-test-new-slug",
			});
			expect(response.status).toBe(201);
			expect(await response.json()).toMatchObject({
				...input,
				slug: "files-test-new-slug",
				createdAt: input.createdAt,
			});
			expect(await getFile(env.DB, "files-test-new")).toBeNull();
			expect(await getLink(env.DB, "files-test-new-slug")).toMatchObject({
				fileId: input.id,
			});
		},
	);

	it("rejects an unrelated ID collision instead of moving or overwriting that mapping", async () => {
		const input = file();
		const stored = await createFile(env.DB, input);
		const link = await getLink(env.DB, input.slug);
		const response = await request(
			"/files",
			"POST",
			file({
				objectKey: "files-test/unrelated.pdf",
				slug: "files-test-unrelated",
			}),
		);
		expect(response.status).toBe(409);
		expect(await response.json()).toMatchObject({
			error: expect.stringContaining("ID"),
		});
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getLink(env.DB, input.slug)).toEqual(link);
		expect(await getLink(env.DB, "files-test-unrelated")).toBeNull();
	});

	it("ignores an incoming ID already used by another key when upserting an existing object", async () => {
		const input = file();
		await createFile(env.DB, input);
		const other = await createFile(
			env.DB,
			file({
				id: "files-test-two",
				objectKey: "files-test/two.pdf",
				slug: "files-test-two",
			}),
		);
		const otherLink = await getLink(env.DB, other.slug);
		const response = await request("/files", "POST", {
			...input,
			id: other.id,
			fileName: "updated.pdf",
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			id: input.id,
			objectKey: input.objectKey,
			fileName: "updated.pdf",
		});
		expect(await getFile(env.DB, other.id)).toEqual(other);
		expect(await getLink(env.DB, other.slug)).toEqual(otherLink);
	});

	it.each([false, true])(
		"rolls back a mapping upsert when a manual link owns its slug (existing: %s)",
		async (existing) => {
			const input = file();
			const stored = existing ? await createFile(env.DB, input) : null;
			const link = await getLink(env.DB, input.slug);
			const slug = "files-test-manual";
			const manual = await manualLink(slug);
			const response = await request("/files", "POST", {
				...input,
				slug,
				size: 99,
				publicUrl: "https://files.example.com/new",
			});
			expect(response.status).toBe(409);
			expect(await getFile(env.DB, input.id)).toEqual(stored);
			expect(await getLink(env.DB, input.slug)).toEqual(link);
			expect(await getLink(env.DB, slug)).toEqual(manual);
			expect(
				(
					await request("/files", "POST", {
						...input,
						slug: "files-test-available",
					})
				).status,
			).toBe(201);
		},
	);

	it.each([false, true])(
		"rejects another mapping's slug even when its owned link is missing: %s",
		async (missingLink) => {
			const original = file();
			const stored = await createFile(env.DB, original);
			if (missingLink)
				await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
					.bind(original.id)
					.run();
			const link = await getLink(env.DB, original.slug);
			const candidate = file({
				id: "files-test-two",
				objectKey: "files-test/two.pdf",
			});
			expect((await request("/files", "POST", candidate)).status).toBe(409);
			expect(await getFile(env.DB, candidate.id)).toBeNull();
			expect(await getFile(env.DB, original.id)).toEqual(stored);
			expect(await getLink(env.DB, original.slug)).toEqual(link);
		},
	);

	it.each(["missing", "stale"])(
		"repairs a %s owned link on an otherwise identical POST",
		async (state) => {
			const input = file();
			const stored = await createFile(env.DB, input);
			if (state === "missing")
				await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
					.bind(input.id)
					.run();
			else
				await env.DB.prepare(
					"UPDATE short_links SET slug = 'files-test-stale', target_url = 'https://example.com/stale', password_hash = 'stale' WHERE file_id = ?",
				)
					.bind(input.id)
					.run();
			const response = await request("/files", "POST", {
				...input,
				id: "files-test-retry",
			});
			expect(response.status).toBe(201);
			expect(await response.json()).toEqual(stored);
			expect(await getLink(env.DB, input.slug)).toEqual({
				slug: input.slug,
				targetUrl: input.publicUrl,
				passwordHash: state === "stale" ? "stale" : null,
				source: "file",
				fileId: input.id,
				createdAt: input.createdAt,
				updatedAt: stored.updatedAt,
			});
			expect(await getLink(env.DB, "files-test-stale")).toBeNull();
		},
	);

	it.each([false, true])(
		"converges racing POSTs with different IDs on one object mapping (changed slug: %s)",
		async (changedSlug) => {
			const first = file();
			const second = file({
				id: "files-test-two",
				...(changedSlug ? { slug: "files-test-two", size: 100 } : {}),
			});
			const responses = await Promise.all([
				request("/files", "POST", first),
				request("/files", "POST", second),
			]);
			const values = await Promise.all(
				responses.map(async (response) => {
					expect(response.status).toBe(201);
					return response.json<StoredFile>();
				}),
			);
			expect(values[0].id).toBe(values[1].id);
			const stored = (await getFile(env.DB, values[0].id))!;
			expect(
				await env.DB.prepare(
					"SELECT COUNT(*) AS count FROM files WHERE object_key = ?",
				)
					.bind(first.objectKey)
					.first("count"),
			).toBe(1);
			expect(
				await env.DB.prepare(
					"SELECT COUNT(*) AS count FROM short_links WHERE file_id = ?",
				)
					.bind(stored.id)
					.first("count"),
			).toBe(1);
			expect(await getLink(env.DB, stored.slug)).toMatchObject({
				fileId: stored.id,
				targetUrl: stored.publicUrl,
				updatedAt: stored.updatedAt,
			});
			if (changedSlug)
				expect(
					await getLink(
						env.DB,
						stored.slug === first.slug ? second.slug : first.slug,
					),
				).toBeNull();
		},
	);

	it.each(["slug", "id"] as const)(
		"allows only one racing insert when different objects share a %s",
		async (field) => {
			const first = file();
			const second = file({
				id: "files-test-two",
				slug: "files-test-two",
				objectKey: "files-test/two.pdf",
				[field]: first[field],
			});
			const responses = await Promise.all([
				request("/files", "POST", first),
				request("/files", "POST", second),
			]);
			expect(responses.map((response) => response.status).sort()).toEqual([
				201, 409,
			]);
			const winner = await responses
				.find((response) => response.status === 201)!
				.json<StoredFile>();
			const loser = winner.objectKey === first.objectKey ? second : first;
			expect(
				await env.DB.prepare("SELECT id FROM files WHERE object_key = ?")
					.bind(loser.objectKey)
					.first("id"),
			).toBeNull();
			expect(await getLink(env.DB, winner.slug)).toMatchObject({
				fileId: winner.id,
				targetUrl: winner.publicUrl,
			});
		},
	);

	it.each(["POST", "PATCH"])(
		"rejects a reserved slug through %s without changing either row",
		async (method) => {
			const input = file();
			const stored = await createFile(env.DB, input);
			const link = await getLink(env.DB, input.slug);
			const response = await request(
				method === "POST" ? "/files" : `/files/${input.id}`,
				method,
				{ ...input, slug: "ADMIN" },
			);
			expect(response.status).toBe(400);
			expect(await getFile(env.DB, input.id)).toEqual(stored);
			expect(await getLink(env.DB, input.slug)).toEqual(link);
		},
	);
});

describe("file edits", () => {
	it.each(["POST slug", "POST metadata", "PATCH slug", "PATCH move"])(
		"preserves the existing password hash through %s changes",
		async (operation) => {
			const input = file();
			await createFile(env.DB, input);
			await env.DB.prepare(
				"UPDATE short_links SET password_hash = ? WHERE file_id = ?",
			)
				.bind("legacy-password-hash", input.id)
				.run();
			const change = {
				slug: operation === "POST metadata" ? input.slug : "files-test-renamed",
				fileName: "renamed.pdf",
				...(operation === "PATCH move"
					? {
							objectKey: "files-test/moved.pdf",
							publicUrl: "https://files.example.com/moved.pdf",
						}
					: {}),
			};
			const isPost = operation.startsWith("POST");
			const response = await request(
				isPost ? "/files" : `/files/${input.id}`,
				isPost ? "POST" : "PATCH",
				{ ...input, ...change },
			);
			expect(response.status).toBe(isPost ? 201 : 200);
			const stored = await response.json<StoredFile>();
			expect(await getFile(env.DB, input.id)).toEqual(stored);
			expect(stored).toMatchObject(change);
			expect(await getLink(env.DB, change.slug)).toMatchObject({
				fileId: input.id,
				passwordHash: "legacy-password-hash",
				targetUrl: stored.publicUrl,
				updatedAt: stored.updatedAt,
			});
			if (change.slug !== input.slug)
				expect(await getLink(env.DB, input.slug)).toBeNull();
		},
	);

	it("moves an object mapping and link together while retaining legacy identity and snapshots", async () => {
		const input = file({
			id: "files-test-ssfs-legacy",
			objectKey: "resume.pdf",
		});
		await createFile(env.DB, input);
		const change = {
			slug: "files-test-moved",
			fileName: "cover.pdf",
			objectKey: "assets/nested/cover.pdf",
			publicUrl: "https://files.example.com/assets/nested/cover.pdf",
		};
		const response = await request(`/files/${input.id}`, "PATCH", change);
		expect(response.status).toBe(200);
		const stored = await response.json<StoredFile>();
		expect(stored).toEqual({
			...input,
			...change,
			updatedAt: expect.any(String),
		});
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getLink(env.DB, input.slug)).toBeNull();
		expect(await getLink(env.DB, change.slug)).toMatchObject({
			fileId: input.id,
			targetUrl: change.publicUrl,
			updatedAt: stored.updatedAt,
		});
		// A subsequent upsert of the moved key must still resolve to the old ID.
		const retried = await request("/files", "POST", {
			...stored,
			id: "files-test-retry",
		});
		expect(retried.status).toBe(201);
		expect(await retried.json()).toEqual(stored);
	});

	it.each(["objectKey", "publicUrl"] as const)(
		"rejects a move with only %s",
		async (field) => {
			const input = file();
			const stored = await createFile(env.DB, input);
			const link = await getLink(env.DB, input.slug);
			const response = await request(`/files/${input.id}`, "PATCH", {
				slug: input.slug,
				fileName: input.fileName,
				[field]:
					field === "objectKey"
						? "files-test/moved.pdf"
						: "https://files.example.com/moved.pdf",
			});
			expect(response.status).toBe(400);
			expect(await getFile(env.DB, input.id)).toEqual(stored);
			expect(await getLink(env.DB, input.slug)).toEqual(link);
		},
	);

	it.each(["folder/", "/root.pdf", "folder/../file.pdf"])(
		"rejects an invalid move key %s",
		async (objectKey) => {
			const input = file();
			const stored = await createFile(env.DB, input);
			const response = await request(`/files/${input.id}`, "PATCH", {
				slug: input.slug,
				fileName: input.fileName,
				objectKey,
				publicUrl: input.publicUrl,
			});
			expect(response.status).toBe(400);
			expect(await getFile(env.DB, input.id)).toEqual(stored);
		},
	);

	it("rolls back both rows when moving onto an existing mapped key", async () => {
		const input = file();
		const stored = await createFile(env.DB, input);
		const other = await createFile(
			env.DB,
			file({
				id: "files-test-two",
				slug: "files-test-two",
				objectKey: "files-test/two.pdf",
			}),
		);
		const link = await getLink(env.DB, input.slug);
		const otherLink = await getLink(env.DB, other.slug);
		const response = await request(`/files/${input.id}`, "PATCH", {
			slug: "files-test-moved",
			fileName: "moved.pdf",
			objectKey: other.objectKey,
			publicUrl: "https://files.example.com/moved.pdf",
		});
		expect(response.status).toBe(409);
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getFile(env.DB, other.id)).toEqual(other);
		expect(await getLink(env.DB, input.slug)).toEqual(link);
		expect(await getLink(env.DB, other.slug)).toEqual(otherLink);
		expect(await getLink(env.DB, "files-test-moved")).toBeNull();
	});

	it("rolls back a move and releases its new key when its slug belongs to a manual link", async () => {
		const input = file();
		const stored = await createFile(env.DB, input);
		const link = await getLink(env.DB, input.slug);
		const manual = await manualLink("files-test-manual");
		const change = {
			slug: "files-test-manual",
			fileName: "moved.pdf",
			objectKey: "files-test/moved.pdf",
			publicUrl: "https://files.example.com/moved.pdf",
		};
		expect((await request(`/files/${input.id}`, "PATCH", change)).status).toBe(
			409,
		);
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getLink(env.DB, input.slug)).toEqual(link);
		expect(await getLink(env.DB, change.slug)).toEqual(manual);
		expect(
			(
				await request(`/files/${input.id}`, "PATCH", {
					...change,
					slug: input.slug,
				})
			).status,
		).toBe(200);
		expect(await getLink(env.DB, input.slug)).toMatchObject({
			targetUrl: change.publicUrl,
			fileId: input.id,
		});
	});

	it("serializes simultaneous moves to the same destination with one winner", async () => {
		const first = await createFile(env.DB, file());
		const second = await createFile(
			env.DB,
			file({
				id: "files-test-two",
				slug: "files-test-two",
				objectKey: "files-test/two.pdf",
			}),
		);
		const objectKey = "files-test/destination.pdf";
		const publicUrl = "https://files.example.com/destination.pdf";
		const responses = await Promise.all(
			[first, second].map((input) =>
				request(`/files/${input.id}`, "PATCH", {
					slug: input.slug,
					fileName: input.fileName,
					objectKey,
					publicUrl,
				}),
			),
		);
		expect(responses.map((response) => response.status).sort()).toEqual([
			200, 409,
		]);
		for (const [index, original] of [first, second].entries()) {
			const current = (await getFile(env.DB, original.id))!;
			if (responses[index].status === 200)
				expect(current).toMatchObject({ objectKey, publicUrl });
			else expect(current).toEqual(original);
			expect(await getLink(env.DB, original.slug)).toMatchObject({
				fileId: original.id,
				targetUrl: current.publicUrl,
				updatedAt: current.updatedAt,
			});
		}
	});

	it("renames both rows and returns the full file with a shared updatedAt", async () => {
		const input = file();
		await createFile(env.DB, input);
		const change = { slug: "files-test-renamed", fileName: "새 이름.pdf" };
		const response = await request(`/files/${input.id}`, "PATCH", change);
		expect(response.status).toBe(200);
		const updated = await response.json<StoredFile>();
		expect(updated).toEqual({
			...input,
			...change,
			updatedAt: expect.any(String),
		});
		expect(updated.updatedAt > input.createdAt).toBe(true);
		expect(await getFile(env.DB, input.id)).toEqual(updated);
		expect(await getLink(env.DB, input.slug)).toBeNull();
		expect(await getLink(env.DB, change.slug)).toEqual({
			slug: change.slug,
			targetUrl: input.publicUrl,
			passwordHash: null,
			source: "file",
			fileId: input.id,
			createdAt: input.createdAt,
			updatedAt: updated.updatedAt,
		});
	});

	it("allows a filename-only edit without treating its own slug as a collision", async () => {
		const input = file();
		await createFile(env.DB, input);
		const response = await request(`/files/${input.id}`, "PATCH", {
			slug: input.slug,
			fileName: "renamed.pdf",
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			...input,
			fileName: "renamed.pdf",
		});
		expect(await getLink(env.DB, input.slug)).toMatchObject({
			fileId: input.id,
		});
	});

	it.each(["files-test-one.pdf", "files-test-repaired"])(
		"recreates a missing owned link when saving slug %s",
		async (slug) => {
			const input = file();
			await createFile(env.DB, input);
			await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
				.bind(input.id)
				.run();
			const response = await request(`/files/${input.id}`, "PATCH", {
				slug,
				fileName: "repaired.pdf",
			});
			expect(response.status).toBe(200);
			const updated = await response.json<StoredFile>();
			expect(await getFile(env.DB, input.id)).toEqual(updated);
			expect(await getLink(env.DB, slug)).toEqual({
				slug,
				targetUrl: input.publicUrl,
				passwordHash: null,
				source: "file",
				fileId: input.id,
				createdAt: input.createdAt,
				updatedAt: updated.updatedAt,
			});
		},
	);

	it.each([false, true])(
		"rolls back both edits when a manual link owns the new slug (missing owned link: %s)",
		async (missingLink) => {
			const input = file();
			const stored = await createFile(env.DB, input);
			if (missingLink)
				await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
					.bind(input.id)
					.run();
			const originalLink = await getLink(env.DB, input.slug);
			const slug = "files-test-manual";
			const manual = await manualLink(slug);
			await expect(
				updateFile(env.DB, input.id, { slug, fileName: "changed.pdf" }),
			).rejects.toMatchObject({ status: 409 });
			expect(
				(
					await request(`/files/${input.id}`, "PATCH", {
						slug,
						fileName: "changed.pdf",
					})
				).status,
			).toBe(409);
			expect(await getFile(env.DB, input.id)).toEqual(stored);
			expect(await getLink(env.DB, input.slug)).toEqual(originalLink);
			expect(await getLink(env.DB, slug)).toEqual(manual);
		},
	);

	it.each([false, true])(
		"rejects another file's slug even if its link is missing: %s",
		async (missingLink) => {
			const first = file();
			const second = file({
				id: "files-test-two",
				slug: "files-test-two",
				objectKey: "files-test/two.pdf",
			});
			const stored = await createFile(env.DB, first);
			const other = await createFile(env.DB, second);
			if (missingLink)
				await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
					.bind(second.id)
					.run();
			const firstLink = await getLink(env.DB, first.slug);
			const secondLink = await getLink(env.DB, second.slug);
			const response = await request(`/files/${first.id}`, "PATCH", {
				slug: second.slug,
				fileName: "collision.pdf",
			});
			expect(response.status).toBe(409);
			expect(await getFile(env.DB, first.id)).toEqual(stored);
			expect(await getFile(env.DB, second.id)).toEqual(other);
			expect(await getLink(env.DB, first.slug)).toEqual(firstLink);
			expect(await getLink(env.DB, second.slug)).toEqual(secondLink);
		},
	);

	it("preserves a manual link occupying a missing owned link's old slug during repair", async () => {
		const input = file();
		await createFile(env.DB, input);
		await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
			.bind(input.id)
			.run();
		const manual = await manualLink(input.slug);
		const response = await request(`/files/${input.id}`, "PATCH", {
			slug: "files-test-new",
			fileName: "repaired.pdf",
		});
		expect(response.status).toBe(200);
		expect(await getLink(env.DB, input.slug)).toEqual(manual);
		expect(await getLink(env.DB, "files-test-new")).toMatchObject({
			fileId: input.id,
			source: "file",
		});
	});
});

describe("file deletion and missing resources", () => {
	it.each([
		undefined,
		{},
		null,
		{ objectKey: "" },
		{ objectKey: "x".repeat(1025) },
	])("rejects deletion without a valid object key: %j", async (body) => {
		const input = file();
		const stored = await createFile(env.DB, input);
		const link = await getLink(env.DB, input.slug);
		const response = await request(`/files/${input.id}`, "DELETE", body);
		expect(response.status).toBe(400);
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getLink(env.DB, input.slug)).toEqual(link);
	});

	it("preserves a moved mapping and password-protected link when a cached ID is deleted with its old key", async () => {
		const input = file();
		await createFile(env.DB, input);
		await env.DB.prepare(
			"UPDATE short_links SET password_hash = ? WHERE file_id = ?",
		)
			.bind("legacy-password-hash", input.id)
			.run();
		const moved = await request(`/files/${input.id}`, "PATCH", {
			slug: "files-test-moved",
			fileName: "moved.pdf",
			objectKey: "files-test/moved.pdf",
			publicUrl: "https://files.example.com/moved.pdf",
		});
		expect(moved.status).toBe(200);
		const stored = await moved.json<StoredFile>();
		const link = await getLink(env.DB, stored.slug);
		expect(link).toMatchObject({ passwordHash: "legacy-password-hash" });
		const staleDelete = await request(`/files/${input.id}`, "DELETE", {
			objectKey: input.objectKey,
		});
		expect(staleDelete.status).toBe(404);
		expect(await staleDelete.json()).toEqual({ error: "File not found" });
		expect(await getFile(env.DB, input.id)).toEqual(stored);
		expect(await getLink(env.DB, stored.slug)).toEqual(link);
		const currentDelete = await request(`/files/${input.id}`, "DELETE", {
			objectKey: stored.objectKey,
		});
		expect(currentDelete.status).toBe(200);
		expect(await currentDelete.json()).toEqual(stored);
		expect(await getFile(env.DB, input.id)).toBeNull();
		expect(await getLink(env.DB, stored.slug)).toBeNull();
	});

	it("removes a legacy mapping whose object key contains a parent path segment", async () => {
		const input = file({ objectKey: "legacy/../resume.pdf" });
		const stored = await createFile(env.DB, input);
		const response = await request(`/files/${input.id}`, "DELETE", {
			objectKey: input.objectKey,
		});
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(stored);
		expect(await getFile(env.DB, input.id)).toBeNull();
		expect(await getLink(env.DB, input.slug)).toBeNull();
	});

	it.each([false, true])(
		"keeps both rows consistent when a move races deletion (delete requested first: %s)",
		async (deleteFirst) => {
			const input = file();
			const original = await createFile(env.DB, input);
			await env.DB.prepare(
				"UPDATE short_links SET password_hash = ? WHERE file_id = ?",
			)
				.bind("legacy-password-hash", input.id)
				.run();
			const change = {
				slug: "files-test-moved",
				fileName: "moved.pdf",
				objectKey: "files-test/moved.pdf",
				publicUrl: "https://files.example.com/moved.pdf",
			};
			const move = () => request(`/files/${input.id}`, "PATCH", change);
			const remove = () =>
				request(`/files/${input.id}`, "DELETE", {
					objectKey: input.objectKey,
				});
			const responses = await Promise.all(
				(deleteFirst ? [remove, move] : [move, remove]).map((run) => run()),
			);
			const [moved, removed] = deleteFirst ? responses.reverse() : responses;
			expect([moved.status, removed.status].sort()).toEqual([200, 404]);
			expect(await getLink(env.DB, input.slug)).toBeNull();
			if (moved.status === 200) {
				const stored = await moved.json<StoredFile>();
				expect(stored).toMatchObject({ ...input, ...change });
				expect(await getFile(env.DB, input.id)).toEqual(stored);
				expect(await getLink(env.DB, change.slug)).toMatchObject({
					fileId: input.id,
					targetUrl: change.publicUrl,
					passwordHash: "legacy-password-hash",
					updatedAt: stored.updatedAt,
				});
			} else {
				expect(await removed.json()).toEqual(original);
				expect(await getFile(env.DB, input.id)).toBeNull();
				expect(await getLink(env.DB, change.slug)).toBeNull();
			}
		},
	);

	it("removes and recreates a slug mapping without making any S3 request", async () => {
		const input = file({ objectKey: "assets/cover.png" });
		const fetch = vi.spyOn(globalThis, "fetch");
		try {
			const stored = await createFile(env.DB, input);
			const removed = await request(`/files/${input.id}`, "DELETE", {
				objectKey: input.objectKey,
			});
			expect(removed.status).toBe(200);
			expect(await removed.json()).toEqual(stored);
			expect(await getFile(env.DB, input.id)).toBeNull();
			expect(await getLink(env.DB, input.slug)).toBeNull();
			const recreated = await request("/files", "POST", {
				...input,
				id: "files-test-recreated",
			});
			expect(recreated.status).toBe(201);
			expect(await recreated.json()).toMatchObject({
				id: "files-test-recreated",
				objectKey: input.objectKey,
			});
			expect(fetch).not.toHaveBeenCalled();
		} finally {
			fetch.mockRestore();
		}
	});

	it.each([false, true])(
		"deletes only the requested file and its owned link (missing owned link: %s)",
		async (missingLink) => {
			const input = file();
			const stored = await createFile(env.DB, input);
			const other = await createFile(
				env.DB,
				file({
					id: "files-test-two",
					slug: "files-test-two",
					objectKey: "files-test/two.pdf",
				}),
			);
			const otherLink = await getLink(env.DB, other.slug);
			if (missingLink)
				await env.DB.prepare("DELETE FROM short_links WHERE file_id = ?")
					.bind(input.id)
					.run();
			const manualSlug = missingLink ? input.slug : "files-test-manual";
			const manual = await manualLink(manualSlug);
			const response = await request(`/files/${input.id}`, "DELETE", {
				objectKey: input.objectKey,
			});
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(stored);
			expect(await getFile(env.DB, input.id)).toBeNull();
			expect(
				await env.DB.prepare("SELECT slug FROM short_links WHERE file_id = ?")
					.bind(input.id)
					.first("slug"),
			).toBeNull();
			expect(await getLink(env.DB, manualSlug)).toEqual(manual);
			expect(await getFile(env.DB, other.id)).toEqual(other);
			expect(await getLink(env.DB, other.slug)).toEqual(otherLink);
			expect(
				(
					await request(`/files/${input.id}`, "DELETE", {
						objectKey: input.objectKey,
					})
				).status,
			).toBe(404);
		},
	);

	it.each(["GET", "PATCH", "DELETE"])(
		"returns 404 for %s of a missing file without changing manual links",
		async (method) => {
			const slug = "files-test-manual";
			const manual = await manualLink(slug);
			const response = await request(
				"/files/files-test-missing",
				method,
				method === "PATCH"
					? { slug, fileName: "missing.pdf" }
					: method === "DELETE"
						? { objectKey: "files-test/missing.pdf" }
						: undefined,
			);
			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ error: "File not found" });
			expect(await getLink(env.DB, slug)).toEqual(manual);
		},
	);

	it("rolls back link deletion when deleting the file fails", async () => {
		const input = file();
		const stored = await createFile(env.DB, input);
		const link = await getLink(env.DB, input.slug);
		await env.DB.prepare(
			"CREATE TRIGGER files_test_reject_delete BEFORE DELETE ON files WHEN OLD.id = 'files-test-one' BEGIN SELECT RAISE(ABORT, 'test delete failure'); END",
		).run();
		try {
			const response = await request(`/files/${input.id}`, "DELETE", {
				objectKey: input.objectKey,
			});
			expect(response.status).toBe(500);
			expect(await getFile(env.DB, input.id)).toEqual(stored);
			expect(await getLink(env.DB, input.slug)).toEqual(link);
		} finally {
			await env.DB.prepare("DROP TRIGGER files_test_reject_delete").run();
		}
	});
});
