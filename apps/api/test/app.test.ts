import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

const headers = () => ({
	authorization: `Bearer ${env.API_TOKEN}`,
	"content-type": "application/json",
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

	it("keeps the baseline migration schema-only", async () => {
		for (const table of [
			"site_settings",
			"projects",
			"timeline_entries",
			"skills",
			"files",
			"short_links",
		]) {
			expect(
				await env.DB.prepare(
					`SELECT COUNT(*) AS count FROM ${table}`,
				).first<number>("count"),
			).toBe(0);
		}
	});

	it("manages portfolio content and keeps hidden work out of the public payload", async () => {
		const settings = {
			name: "남우석",
			title: "Product Engineer",
			intro: "제품을 만드는 엔지니어입니다.",
			email: "me@suk.kr",
			location: "Seoul, Korea",
			resumeUrl: "https://suk.kr/resume",
			githubUrl: "https://github.com/suk-6",
			linkedinUrl: "",
			availableFor: "좋은 문제에 열려 있습니다.",
		};
		expect(
			(
				await app.request(
					"/settings",
					{ method: "PUT", headers: headers(), body: JSON.stringify(settings) },
					env,
				)
			).status,
		).toBe(200);

		const project = {
			id: "project-visible",
			slug: "visible",
			name: "Visible project",
			organization: "suk.kr",
			subtitle: "subtitle",
			description: "description",
			coverUrl: "",
			projectUrl: "",
			repoUrl: "",
			tags: ["TypeScript"],
			highlights: ["Small interfaces"],
			caseStudy: [
				{
					title: "Problem",
					body: "A detailed case-study section.",
					imageUrl: "https://example.com/case-study.png",
					code: "const answer = 42;",
					codeLanguage: "typescript",
				},
			],
			sortOrder: 10,
			visible: true,
		};
		const hiddenProject = {
			...project,
			id: "project-hidden",
			slug: "hidden",
			name: "Hidden project",
			visible: false,
		};
		for (const value of [project, hiddenProject]) {
			expect(
				(
					await app.request(
						`/projects/${value.id}`,
						{ method: "PUT", headers: headers(), body: JSON.stringify(value) },
						env,
					)
				).status,
			).toBe(200);
		}

		const entries = [
			"experience",
			"education",
			"activity",
			"award",
			"certificate",
		].map((kind, index) => ({
			id: `entry-${kind}`,
			kind,
			title: `${kind} title`,
			organization: "suk.kr",
			startDate: "2026.08",
			endDate: "현재",
			description: "description",
			url: "",
			sortOrder: (index + 1) * 10,
			visible: true,
		}));
		const hiddenEntry = {
			...entries[0],
			id: "entry-hidden",
			title: "Hidden entry",
			visible: false,
		};
		for (const value of [...entries, hiddenEntry]) {
			expect(
				(
					await app.request(
						`/entries/${value.id}`,
						{ method: "PUT", headers: headers(), body: JSON.stringify(value) },
						env,
					)
				).status,
			).toBe(200);
		}

		const skill = {
			id: "skill-test",
			name: "Cloudflare Workers",
			groupName: "Backend",
			sortOrder: 10,
		};
		expect(
			(
				await app.request(
					`/skills/${skill.id}`,
					{ method: "PUT", headers: headers(), body: JSON.stringify(skill) },
					env,
				)
			).status,
		).toBe(200);

		const managedProjects = await (
			await app.request("/projects", { headers: headers() }, env)
		).json<Array<{ id: string }>>();
		expect(managedProjects.map(({ id }) => id)).toEqual(
			expect.arrayContaining([project.id, hiddenProject.id]),
		);

		const portfolio = await (
			await app.request("/portfolio", { headers: headers() }, env)
		).json<{
			settings: typeof settings;
			projects: Array<{ id: string; caseStudy: typeof project.caseStudy }>;
			entries: Array<{ id: string }>;
			skills: Array<{ id: string }>;
		}>();
		expect(portfolio.settings).toEqual(settings);
		expect(portfolio.projects.map(({ id }) => id)).toContain(project.id);
		expect(
			portfolio.projects.find(({ id }) => id === project.id)?.caseStudy,
		).toEqual(project.caseStudy);
		expect(portfolio.projects.map(({ id }) => id)).not.toContain(
			hiddenProject.id,
		);
		expect(portfolio.entries.map(({ id }) => id)).toEqual(
			expect.arrayContaining(entries.map(({ id }) => id)),
		);
		expect(portfolio.entries.map(({ id }) => id)).not.toContain(hiddenEntry.id);
		expect(portfolio.skills.map(({ id }) => id)).toContain(skill.id);

		for (const [path, id] of [
			["projects", project.id],
			["projects", hiddenProject.id],
			...entries.map(({ id }) => ["entries", id] as const),
			["entries", hiddenEntry.id],
			["skills", skill.id],
		] as const) {
			expect(
				(
					await app.request(
						`/${path}/${id}`,
						{ method: "DELETE", headers: headers() },
						env,
					)
				).status,
			).toBe(204);
		}
	});

	it("creates, renames, protects, and deletes manual short links", async () => {
		const value = {
			slug: "manual-test",
			targetUrl: "https://example.com/one",
			passwordHash: "salt:hash",
		};
		expect(
			(
				await app.request(
					`/links/${value.slug}`,
					{ method: "PUT", headers: headers(), body: JSON.stringify(value) },
					env,
				)
			).status,
		).toBe(200);
		const renamed = { ...value, slug: "manual-renamed" };
		expect(
			(
				await app.request(
					`/links/${value.slug}`,
					{ method: "PUT", headers: headers(), body: JSON.stringify(renamed) },
					env,
				)
			).status,
		).toBe(200);
		expect(
			(await app.request(`/links/${value.slug}`, { headers: headers() }, env))
				.status,
		).toBe(404);
		expect(
			await (
				await app.request(`/links/${renamed.slug}`, { headers: headers() }, env)
			).json<{ passwordHash: string }>(),
		).toMatchObject({ passwordHash: value.passwordHash });
		expect(
			(
				await app.request(
					`/links/${renamed.slug}`,
					{ method: "DELETE", headers: headers() },
					env,
				)
			).status,
		).toBe(204);
	});

	it("keeps file-owned short links read-only in link management", async () => {
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
			{ method: "POST", headers: headers(), body: JSON.stringify(file) },
			env,
		);
		expect(created.status).toBe(201);

		const deletedThroughLinks = await app.request(
			`/links/${encodeURIComponent(file.slug)}`,
			{ method: "DELETE", headers: headers() },
			env,
		);
		expect(deletedThroughLinks.status).toBe(409);

		const renamedThroughFiles = await app.request(
			`/files/${file.id}`,
			{
				method: "PATCH",
				headers: headers(),
				body: JSON.stringify({
					slug: "file-renamed-test",
					fileName: "resume.pdf",
				}),
			},
			env,
		);
		expect(renamedThroughFiles.status).toBe(200);
		expect(
			await env.DB.prepare("SELECT slug FROM short_links WHERE file_id = ?")
				.bind(file.id)
				.first("slug"),
		).toBe("file-renamed-test");

		const overwrittenThroughLinks = await app.request(
			"/links/file-renamed-test",
			{
				method: "PUT",
				headers: headers(),
				body: JSON.stringify({
					slug: "file-renamed-test",
					targetUrl: "https://example.com",
					passwordHash: null,
				}),
			},
			env,
		);
		expect(overwrittenThroughLinks.status).toBe(409);

		const deleted = await app.request(
			`/files/${file.id}`,
			{ method: "DELETE", headers: headers() },
			env,
		);
		expect(deleted.status).toBe(200);
		expect((await deleted.json<{ objectKey: string }>()).objectKey).toBe(
			file.objectKey,
		);
		expect(
			await env.DB.prepare("SELECT id FROM files WHERE id = ?")
				.bind(file.id)
				.first("id"),
		).toBeNull();
		expect(
			await env.DB.prepare("SELECT slug FROM short_links WHERE file_id = ?")
				.bind(file.id)
				.first("slug"),
		).toBeNull();
		expect(
			(
				await app.request(
					`/files/${file.id}`,
					{ method: "DELETE", headers: headers() },
					env,
				)
			).status,
		).toBe(404);
	});

	it("rejects oversized JSON bodies", async () => {
		const response = await app.request(
			"/links/large",
			{
				method: "PUT",
				headers: headers(),
				body: JSON.stringify({ padding: "x".repeat(70_000) }),
			},
			env,
		);
		expect(response.status).toBe(413);
	});
});
