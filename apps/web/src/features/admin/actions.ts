"use server";

import {
	entrySchema,
	fileSchema,
	fileUpdateSchema,
	linkSchema,
	noticeSchema,
	projectSchema,
	type StoredFile,
	settingsSchema,
	skillSchema,
} from "@suk/contracts";
import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteObject } from "@/features/files/s3";
import { api } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/crypto/password";

const authorize = async () => {
	if (!(await isAdmin())) redirect("/admin");
};
const text = (data: FormData, key: string) =>
	String(data.get(key) ?? "").trim();
const number = (data: FormData, key: string) => Number(data.get(key) ?? 0);
const dateTime = (data: FormData, key: string) => {
	const value = text(data, key);
	return value ? new Date(`${value}:00+09:00`).toISOString() : "";
};
const lines = (data: FormData, key: string) =>
	text(data, key)
		.split("\n")
		.map((value) => value.trim())
		.filter(Boolean);
const caseStudy = (data: FormData) => {
	const titles = data.getAll("caseStudyTitle").map(String);
	const bodies = data.getAll("caseStudyBody").map(String);
	const imageUrls = data.getAll("caseStudyImageUrl").map(String);
	const codes = data.getAll("caseStudyCode").map(String);
	const codeLanguages = data.getAll("caseStudyCodeLanguage").map(String);
	return titles
		.map((title, index) => ({
			title: title.trim(),
			body: (bodies[index] ?? "").trim(),
			imageUrl: (imageUrls[index] ?? "").trim(),
			code: (codes[index] ?? "").trim(),
			codeLanguage: (codeLanguages[index] ?? "").trim(),
		}))
		.filter(({ title, body }) => title || body);
};
const done = () => {
	revalidatePath("/");
	revalidatePath("/admin");
};

export const saveSettings = async (data: FormData) => {
	await authorize();
	const value = settingsSchema.parse({
		name: text(data, "name"),
		title: text(data, "title"),
		intro: text(data, "intro"),
		email: text(data, "email"),
		location: text(data, "location"),
		resumeUrl: text(data, "resumeUrl"),
		githubUrl: text(data, "githubUrl"),
		linkedinUrl: text(data, "linkedinUrl"),
		availableFor: text(data, "availableFor"),
	});
	await api.mutate("/settings", "PUT", value);
	done();
};

export const saveProject = async (data: FormData) => {
	await authorize();
	const id = text(data, "id") || crypto.randomUUID();
	const value = projectSchema.parse({
		id,
		slug: text(data, "slug"),
		name: text(data, "name"),
		organization: text(data, "organization"),
		subtitle: text(data, "subtitle"),
		description: text(data, "description"),
		coverUrl: text(data, "coverUrl"),
		projectUrl: text(data, "projectUrl"),
		repoUrl: text(data, "repoUrl"),
		tags: lines(data, "tags"),
		highlights: lines(data, "highlights"),
		caseStudy: caseStudy(data),
		sortOrder: number(data, "sortOrder"),
		visible: data.get("visible") === "on",
	});
	await api.mutate(`/projects/${id}`, "PUT", value);
	done();
};

export const saveCaseStudy = async (data: FormData) => {
	await authorize();
	const id = text(data, "id");
	const project = (await api.projects()).find((value) => value.id === id);
	if (!project) throw new Error("Project not found");
	const value = projectSchema.parse({
		...project,
		caseStudy: caseStudy(data),
	});
	await api.mutate(`/projects/${id}`, "PUT", value);
	revalidatePath(`/work/${project.slug}`);
	revalidatePath(`/admin/projects/${id}/case-study`);
	redirect(`/admin/projects/${id}/case-study?saved=1` as Route);
};

export const removeProject = async (data: FormData) => {
	await authorize();
	await api.mutate(`/projects/${text(data, "id")}`, "DELETE");
	done();
};

export const saveEntry = async (data: FormData) => {
	await authorize();
	const id = text(data, "id") || crypto.randomUUID();
	const value = entrySchema.parse({
		id,
		kind: text(data, "kind"),
		title: text(data, "title"),
		organization: text(data, "organization"),
		startDate: text(data, "startDate"),
		endDate: text(data, "endDate"),
		description: text(data, "description"),
		url: text(data, "url"),
		sortOrder: number(data, "sortOrder"),
		visible: data.get("visible") === "on",
	});
	await api.mutate(`/entries/${id}`, "PUT", value);
	done();
};

export const removeEntry = async (data: FormData) => {
	await authorize();
	await api.mutate(`/entries/${text(data, "id")}`, "DELETE");
	done();
};

export const saveSkill = async (data: FormData) => {
	await authorize();
	const id = text(data, "id") || crypto.randomUUID();
	await api.mutate(
		`/skills/${id}`,
		"PUT",
		skillSchema.parse({
			id,
			name: text(data, "name"),
			groupName: text(data, "groupName"),
			sortOrder: number(data, "sortOrder"),
		}),
	);
	done();
};

export const removeSkill = async (data: FormData) => {
	await authorize();
	await api.mutate(`/skills/${text(data, "id")}`, "DELETE");
	done();
};

export const saveNotice = async (data: FormData) => {
	await authorize();
	const id = text(data, "id") || crypto.randomUUID();
	await api.mutate(
		`/notices/${id}`,
		"PUT",
		noticeSchema.parse({
			id,
			title: text(data, "title"),
			content: text(data, "content"),
			startsAt: dateTime(data, "startsAt"),
			endsAt: dateTime(data, "endsAt"),
			sortOrder: number(data, "sortOrder"),
			visible: data.get("visible") === "on",
		}),
	);
	done();
};

export const removeNotice = async (data: FormData) => {
	await authorize();
	await api.mutate(`/notices/${text(data, "id")}`, "DELETE");
	done();
};

export const saveLink = async (data: FormData) => {
	await authorize();
	const slug = text(data, "slug");
	const previousSlug = text(data, "previousSlug");
	const password = text(data, "password");
	const previous = previousSlug ? await api.link(previousSlug) : null;
	const value = linkSchema.parse({
		slug,
		targetUrl: text(data, "targetUrl"),
		passwordHash: password
			? hashPassword(password)
			: (previous?.passwordHash ?? null),
	});
	await api.mutate(
		`/links/${encodeURIComponent(previousSlug || slug)}`,
		"PUT",
		value,
	);
	done();
};

export const removeLink = async (data: FormData) => {
	await authorize();
	await api.mutate(
		`/links/${encodeURIComponent(text(data, "previousSlug") || text(data, "slug"))}`,
		"DELETE",
	);
	done();
};

export const createFile = async (data: FormData) => {
	await authorize();
	const value = fileSchema.parse({
		id: crypto.randomUUID(),
		slug: text(data, "slug"),
		fileName: text(data, "fileName"),
		objectKey: text(data, "objectKey"),
		contentType: text(data, "contentType"),
		size: number(data, "size"),
		publicUrl: `${process.env.NEXT_PUBLIC_S3_URL}/${encodeURIComponent(text(data, "objectKey")).replaceAll("%2F", "/")}`,
		createdAt: new Date().toISOString(),
	});
	try {
		await api.mutate("/files", "POST", value);
	} catch (error) {
		await deleteObject(value.objectKey).catch((cleanupError) =>
			console.error("Failed to clean up an untracked upload", cleanupError),
		);
		throw error;
	}
	done();
};

export const updateFile = async (data: FormData) => {
	await authorize();
	const value = fileUpdateSchema.parse({
		slug: text(data, "slug"),
		fileName: text(data, "fileName"),
	});
	await api.mutate(`/files/${text(data, "id")}`, "PATCH", value);
	done();
};

export const removeFile = async (data: FormData) => {
	await authorize();
	const deleted = await api.mutate<StoredFile>(
		`/files/${text(data, "id")}`,
		"DELETE",
	);
	try {
		await deleteObject(deleted.objectKey);
	} catch (error) {
		await api
			.mutate("/files", "POST", deleted)
			.catch((rollbackError) =>
				console.error("Failed to restore file metadata", rollbackError),
			);
		throw error;
	}
	done();
};
