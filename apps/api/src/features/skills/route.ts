import { skillSchema } from "@suk/contracts";
import { Hono } from "hono";
import { deleteSkill, getSkills, saveSkill } from "./repo";

export const skillsRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) => context.json(await getSkills(context.env.DB)))
	.put("/:id", async (context) => {
		const value = skillSchema.parse({
			...(await context.req.json()),
			id: context.req.param("id"),
		});
		await saveSkill(context.env.DB, value);
		return context.json(value);
	})
	.delete("/:id", async (context) => {
		await deleteSkill(context.env.DB, context.req.param("id"));
		return context.body(null, 204);
	});
