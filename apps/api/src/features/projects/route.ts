import { projectSchema } from "@suk/contracts";
import { Hono } from "hono";
import { deleteProject, getProjects, saveProject } from "./repo";

export const projectsRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) =>
		context.json(await getProjects(context.env.DB, true)),
	)
	.put("/:id", async (context) => {
		const value = projectSchema.parse({
			...(await context.req.json()),
			id: context.req.param("id"),
		});
		await saveProject(context.env.DB, value);
		return context.json(value);
	})
	.delete("/:id", async (context) => {
		await deleteProject(context.env.DB, context.req.param("id"));
		return context.body(null, 204);
	});
