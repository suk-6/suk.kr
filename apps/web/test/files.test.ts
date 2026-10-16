import type { StoredFile } from "@suk/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/files/objects/route";
import { POST as saveSlug } from "@/app/api/files/route";
import { POST as sign } from "@/app/api/files/sign/route";
import { operationPlan } from "@/features/files/operations";
import * as s3 from "@/features/files/s3";
import { api, ApiError } from "@/lib/api/client";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/files/auth", () => ({
	fileAuthorization: vi.fn(async () => null),
}));
vi.mock("@/features/files/s3", () => ({
	findObject: vi.fn(),
	folderObjects: vi.fn(),
	headObject: vi.fn(),
	deleteObject: vi.fn(),
	copyObject: vi.fn(),
	signUpload: vi.fn(),
	publicObjectUrl: (key: string) => `https://files.example/${key}`,
}));
vi.mock("@/lib/api/client", () => ({
	api: { files: vi.fn(), file: vi.fn(), mutate: vi.fn() },
	ApiError: class extends Error {
		constructor(
			public status: number,
			message: string,
		) {
			super(message);
		}
	},
}));

const objects = new Map<string, { etag: string; size: number }>();
const mapping = (key = "source/file.txt"): StoredFile => ({
	id: "legacy-id",
	objectKey: key,
	slug: "document",
	fileName: "file.txt",
	contentType: "text/plain",
	size: 3,
	publicUrl: `https://files.example/${key}`,
	createdAt: "2020-01-01T00:00:00.000Z",
	updatedAt: "2020-01-01T00:00:00.000Z",
});
const request = (value: unknown, method = "POST") =>
	new Request("http://localhost/api/files", {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(value),
	});
const reviewed = async (key = "source/file.txt") => ({
	objectKey: key,
	objects: (await operationPlan(key)).objects,
});

beforeEach(() => {
	vi.resetAllMocks();
	objects.clear();
	objects.set("source/file.txt", { etag: '"original"', size: 3 });
	vi.mocked(api.files).mockResolvedValue([]);
	vi.mocked(api.mutate).mockResolvedValue(undefined);
	vi.mocked(s3.findObject).mockImplementation(async (key) => {
		const object = objects.get(key);
		return object
			? { ETag: object.etag, ContentLength: object.size, $metadata: {} }
			: null;
	});
	vi.mocked(s3.folderObjects).mockImplementation(async function* (prefix) {
		for (const [key, object] of objects)
			if (key.startsWith(prefix))
				yield { Key: key, ETag: object.etag, Size: object.size };
	});
	vi.mocked(s3.deleteObject).mockImplementation(async (key, etag) => {
		if (objects.get(key)?.etag !== etag)
			throw new ApiError(409, "Object changed");
		objects.delete(key);
		return { $metadata: {} };
	});
	vi.mocked(s3.copyObject).mockImplementation(async (source, target, etag) => {
		if (objects.get(source)?.etag !== etag || objects.has(target))
			throw new ApiError(409, "Object changed");
		objects.set(target, { ...objects.get(source)! });
		return { $metadata: {} };
	});
	vi.mocked(s3.signUpload).mockResolvedValue("https://files.example/signed");
});

describe("reviewed S3 operations", () => {
	it.each(["source/file.txt", "source/"])(
		"rejects a replacement after reviewing %s without changing S3 or D1",
		async (key) => {
			const input = await reviewed(key);
			objects.set("source/file.txt", { etag: '"replacement"', size: 3 });
			expect((await DELETE(request(input, "DELETE"))).status).toBe(409);
			expect(
				(
					await PATCH(
						request(
							{
								...input,
								destinationKey: key.endsWith("/") ? "target/" : "target.txt",
							},
							"PATCH",
						),
					)
				).status,
			).toBe(409);
			expect(s3.deleteObject).not.toHaveBeenCalled();
			expect(s3.copyObject).not.toHaveBeenCalled();
			expect(api.mutate).not.toHaveBeenCalled();
		},
	);
	it("rejects same-count folder key swaps and duplicate review entries", async () => {
		const input = await reviewed("source/");
		objects.delete("source/file.txt");
		objects.set("source/other.txt", { etag: '"original"', size: 3 });
		expect((await DELETE(request(input, "DELETE"))).status).toBe(409);
		const fresh = await reviewed("source/");
		fresh.objects.push(fresh.objects[0]);
		expect((await DELETE(request(fresh, "DELETE"))).status).toBe(409);
		expect(s3.deleteObject).not.toHaveBeenCalled();
	});
	it("uses the reviewed ETag for deletion and passes the cached mapping key to the Worker", async () => {
		const file = mapping();
		vi.mocked(api.files).mockResolvedValue([file]);
		expect((await DELETE(request(await reviewed(), "DELETE"))).status).toBe(
			200,
		);
		expect(s3.deleteObject).toHaveBeenCalledWith(file.objectKey, '"original"');
		expect(api.mutate).toHaveBeenCalledWith("/files/legacy-id", "DELETE", {
			objectKey: file.objectKey,
		});
	});
	it("does not remove a mapping if conditional S3 deletion fails after review", async () => {
		vi.mocked(api.files).mockResolvedValue([mapping()]);
		vi.mocked(s3.deleteObject).mockRejectedValue(
			new ApiError(409, "Object changed"),
		);
		expect((await DELETE(request(await reviewed(), "DELETE"))).status).toBe(
			409,
		);
		expect(api.mutate).not.toHaveBeenCalled();
	});
	it.each(["etag", "size"] as const)(
		"refuses an existing move destination with a different %s",
		async (field) => {
			objects.set("target/file.txt", {
				etag: '"original"',
				size: 3,
				...(field === "etag" ? { etag: '"different"' } : { size: 4 }),
			});
			const response = await PATCH(
				request(
					{ ...(await reviewed("source/")), destinationKey: "target/" },
					"PATCH",
				),
			);
			expect(response.status).toBe(409);
			expect(s3.copyObject).not.toHaveBeenCalled();
			expect(s3.deleteObject).not.toHaveBeenCalled();
		},
	);
	it("resumes a partially copied folder move, transfers its slug, then deletes the source", async () => {
		objects.set("target/file.txt", { etag: '"original"', size: 3 });
		objects.set("target/already-finished.txt", { etag: '"finished"', size: 8 });
		vi.mocked(api.files).mockResolvedValue([mapping()]);
		const response = await PATCH(
			request(
				{ ...(await reviewed("source/")), destinationKey: "target/" },
				"PATCH",
			),
		);
		expect(response.status).toBe(200);
		expect(s3.copyObject).not.toHaveBeenCalled();
		expect(api.mutate).toHaveBeenCalledWith(
			"/files/legacy-id",
			"PATCH",
			expect.objectContaining({
				objectKey: "target/file.txt",
				slug: "document",
			}),
		);
		expect(s3.deleteObject).toHaveBeenCalledWith(
			"source/file.txt",
			'"original"',
		);
		expect(vi.mocked(api.mutate).mock.invocationCallOrder[0]).toBeLessThan(
			vi.mocked(s3.deleteObject).mock.invocationCallOrder[0],
		);
		expect(objects.has("target/already-finished.txt")).toBe(true);
	});
	it("resumes when the mapping transfer already succeeded before a lost response", async () => {
		objects.set("target/file.txt", { etag: '"original"', size: 3 });
		vi.mocked(api.files).mockResolvedValue([mapping("target/file.txt")]);
		expect(
			(
				await PATCH(
					request(
						{ ...(await reviewed("source/")), destinationKey: "target/" },
						"PATCH",
					),
				)
			).status,
		).toBe(200);
		expect(api.mutate).not.toHaveBeenCalled();
		expect(objects.has("source/file.txt")).toBe(false);
	});
	it("copies a missing target using the reviewed source ETag", async () => {
		expect(
			(
				await PATCH(
					request(
						{ ...(await reviewed()), destinationKey: "target.txt" },
						"PATCH",
					),
				)
			).status,
		).toBe(200);
		expect(s3.copyObject).toHaveBeenCalledWith(
			"source/file.txt",
			"target.txt",
			'"original"',
		);
	});
});

describe("overwrite signing", () => {
	const input = {
		objectKey: "source/file.txt",
		contentType: "text/plain",
		size: 3,
		overwrite: true,
		etag: '"original"',
	};
	it("binds the signed URL and browser headers to the reviewed ETag", async () => {
		const response = await sign(request(input));
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			headers: { "Content-Type": "text/plain", "If-Match": '"original"' },
		});
		expect(s3.signUpload).toHaveBeenCalledWith(
			input.objectKey,
			"text/plain",
			true,
			'"original"',
		);
	});
	it.each([undefined, '"stale"'])(
		"refuses overwrite without a matching reviewed ETag: %s",
		async (etag) => {
			expect((await sign(request({ ...input, etag }))).status).toBe(409);
			expect(s3.signUpload).not.toHaveBeenCalled();
		},
	);
	it("keeps conditional creation and stronger asset confirmation", async () => {
		objects.delete("source/file.txt");
		expect(
			await (
				await sign(request({ ...input, overwrite: false, etag: undefined }))
			).json(),
		).toMatchObject({ headers: { "If-None-Match": "*" } });
		objects.set("assets/cover.png", { etag: '"original"', size: 3 });
		expect(
			(await sign(request({ ...input, objectKey: "assets/cover.png" }))).status,
		).toBe(403);
		expect(
			(
				await sign(
					request({
						...input,
						objectKey: "assets/cover.png",
						confirmation: "assets/",
					}),
				)
			).status,
		).toBe(200);
	});
});

describe("legacy mapping removal", () => {
	it("removes by stable ID without validating or touching its legacy object key", async () => {
		vi.mocked(api.file).mockResolvedValue(mapping("legacy/../resume.pdf"));
		expect(
			(await saveSlug(request({ id: "legacy-id", slug: null }))).status,
		).toBe(204);
		expect(api.file).toHaveBeenCalledWith("legacy-id");
		expect(api.mutate).toHaveBeenCalledWith("/files/legacy-id", "DELETE", {
			objectKey: "legacy/../resume.pdf",
		});
		expect(s3.headObject).not.toHaveBeenCalled();
		expect(s3.deleteObject).not.toHaveBeenCalled();
	});
	it("treats an already-removed or moved mapping as a harmless retry", async () => {
		vi.mocked(api.file).mockResolvedValue(mapping("legacy/../resume.pdf"));
		vi.mocked(api.mutate).mockRejectedValue(
			new ApiError(404, "File not found"),
		);
		expect(
			(await saveSlug(request({ id: "legacy-id", slug: null }))).status,
		).toBe(204);
	});
	it("requires an explicit stable ID rather than generating one or accepting an unsafe key", async () => {
		expect((await saveSlug(request({ slug: null }))).status).toBe(400);
		expect(
			(
				await saveSlug(
					request({ objectKey: "legacy/../resume.pdf", slug: null }),
				)
			).status,
		).toBe(400);
		expect(api.file).not.toHaveBeenCalled();
		expect(api.mutate).not.toHaveBeenCalled();
	});
});
