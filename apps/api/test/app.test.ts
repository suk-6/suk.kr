import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/app";

beforeAll(async () => {
	await env.DB.batch([
		env.DB.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
			id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT NOT NULL, title TEXT NOT NULL, intro TEXT NOT NULL,
			email TEXT NOT NULL, location TEXT NOT NULL, resume_url TEXT NOT NULL, github_url TEXT NOT NULL,
			linkedin_url TEXT NOT NULL, available_for TEXT NOT NULL, updated_at TEXT NOT NULL
		)`),
		env.DB.prepare(`CREATE TABLE IF NOT EXISTS files (
			id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, file_name TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
			content_type TEXT NOT NULL, size INTEGER NOT NULL, public_url TEXT NOT NULL, created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`),
		env.DB.prepare(`CREATE TABLE IF NOT EXISTS short_links (
			slug TEXT PRIMARY KEY, target_url TEXT NOT NULL, password_hash TEXT, source TEXT NOT NULL,
			file_id TEXT UNIQUE REFERENCES files(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		)`),
	]);
	await env.DB.prepare(
		"INSERT OR REPLACE INTO site_settings VALUES (1, '남우석', 'Software Engineer', 'intro', 'me@suk.kr', 'Seoul', '', '', '', '', ?)",
	)
		.bind(new Date().toISOString())
		.run();
});

describe("api", () => {
	it("reports health without authentication", async () => {
		const response = await app.request("/health", {}, env);
		expect(response.status).toBe(200);
	});

	it("protects stateful resources", async () => {
		const response = await app.request("/portfolio", {}, env);
		expect(response.status).toBe(401);
	});

	it("keeps file-owned short links read-only in link management", async () => {
		const headers = {
			authorization: `Bearer ${env.API_TOKEN}`,
			"content-type": "application/json",
		};
		const file = {
			id: "file-test",
			slug: "파일 이름.pdf",
			fileName: "파일 이름.pdf",
			objectKey: "파일 이름.pdf",
			contentType: "application/pdf",
			size: 42,
			publicUrl: "https://file.suk.kr/file.pdf",
			createdAt: new Date().toISOString(),
		};
		const created = await app.request(
			"/files",
			{ method: "POST", headers, body: JSON.stringify(file) },
			env,
		);
		expect(created.status).toBe(201);

		const deletedThroughLinks = await app.request(
			`/links/${encodeURIComponent(file.slug)}`,
			{ method: "DELETE", headers },
			env,
		);
		expect(deletedThroughLinks.status).toBe(409);

		const renamedThroughFiles = await app.request(
			`/files/${file.id}`,
			{
				method: "PATCH",
				headers,
				body: JSON.stringify({ slug: "resume", fileName: "resume.pdf" }),
			},
			env,
		);
		expect(renamedThroughFiles.status).toBe(200);
		expect(
			await env.DB.prepare("SELECT slug FROM short_links WHERE file_id = ?")
				.bind(file.id)
				.first("slug"),
		).toBe("resume");
	});
});
