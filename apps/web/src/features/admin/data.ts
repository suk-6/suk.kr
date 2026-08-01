import { api } from "@/lib/api/client";

export const getAdminData = async () => {
	const [settings, projects, entries, skills, links, files] = await Promise.all(
		[
			api.settings(),
			api.projects(),
			api.entries(),
			api.skills(),
			api.links(),
			api.files(),
		],
	);
	return { settings, projects, entries, skills, links, files };
};

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
