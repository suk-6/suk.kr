import { Hono } from "hono";
import { getEntries } from "../entries/repo";
import { getProjects } from "../projects/repo";
import { getSettings } from "../settings/repo";
import { getSkills } from "../skills/repo";

export const portfolioRoute = new Hono<{ Bindings: Env }>().get(
	"/",
	async (context) => {
		const [settings, projects, entries, skills] = await Promise.all([
			getSettings(context.env.DB),
			getProjects(context.env.DB),
			getEntries(context.env.DB),
			getSkills(context.env.DB),
		]);
		return context.json({ settings, projects, entries, skills });
	},
);
