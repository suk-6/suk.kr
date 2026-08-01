import { settingsSchema } from "@suk/contracts";
import { Hono } from "hono";
import { getSettings, saveSettings } from "./repo";

export const settingsRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) => context.json(await getSettings(context.env.DB)))
	.put("/", async (context) => {
		const value = settingsSchema.parse(await context.req.json());
		await saveSettings(context.env.DB, value);
		return context.json(value);
	});
