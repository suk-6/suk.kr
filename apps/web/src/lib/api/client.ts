import type {
	Entry,
	Note,
	NoteListItem,
	Portfolio,
	Project,
	Settings,
	ShortLink,
	Skill,
	SiteNotice,
	StoredFile,
} from "@suk/contracts";
import "server-only";

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
	}
}

const request = async <T>(
	path: string,
	init?: RequestInit & { revalidate?: number },
): Promise<T> => {
	const response = await fetch(`${process.env.API_BASE_URL}${path}`, {
		...init,
		signal: init?.signal ?? AbortSignal.timeout(15_000),
		headers: {
			Authorization: `Bearer ${process.env.API_TOKEN}`,
			"Content-Type": "application/json",
			...init?.headers,
		},
		next: init?.revalidate ? { revalidate: init.revalidate } : undefined,
		cache: init?.revalidate ? undefined : "no-store",
	});

	if (!response.ok) {
		const body = (await response
			.json()
			.catch(() => ({ error: response.statusText }))) as { error?: string };
		throw new ApiError(response.status, body.error ?? "API request failed");
	}

	return response.status === 204
		? (undefined as T)
		: ((await response.json()) as T);
};

export const api = {
	portfolio: () => request<Portfolio>("/portfolio", { revalidate: 300 }),
	settings: () => request<Settings>("/settings"),
	projects: () => request<Project[]>("/projects"),
	entries: () => request<Entry[]>("/entries"),
	skills: () => request<Skill[]>("/skills"),
	links: () => request<ShortLink[]>("/links"),
	link: (slug: string) =>
		request<ShortLink>(`/links/${encodeURIComponent(slug)}`),
	files: () => request<StoredFile[]>("/files"),
	notices: () => request<SiteNotice[]>("/notices"),
	notes: () => request<NoteListItem[]>("/notes"),
	note: (id: string) =>
		request<Note>(`/notes/${encodeURIComponent(id)}`).catch((error) => {
			if (error instanceof Error && error.message === "Not found") return null;
			throw error;
		}),
	file: (id: string) => request<StoredFile>(`/files/${encodeURIComponent(id)}`),
	mutate: <T>(
		path: string,
		method: "POST" | "PUT" | "PATCH" | "DELETE",
		value?: unknown,
	) =>
		request<T>(path, {
			method,
			body: value === undefined ? undefined : JSON.stringify(value),
		}),
};
