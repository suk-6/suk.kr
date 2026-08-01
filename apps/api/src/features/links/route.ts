import { linkSchema } from "@suk/contracts";
import { Hono } from "hono";
import { deleteLink, getLink, getLinks, saveLink } from "./repo";

export const linksRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) => context.json(await getLinks(context.env.DB)))
	.get("/:slug", async (context) => {
		const value = await getLink(
			context.env.DB,
			decodeURIComponent(context.req.param("slug")),
		);
		return value
			? context.json(value)
			: context.json({ error: "Not found" }, 404);
	})
	.put("/:slug", async (context) => {
		const value = linkSchema.parse(await context.req.json());
		await saveLink(
			context.env.DB,
			value,
			decodeURIComponent(context.req.param("slug")),
		);
		return context.json(value);
	})
	.delete("/:slug", async (context) => {
		await deleteLink(
			context.env.DB,
			decodeURIComponent(context.req.param("slug")),
		);
		return context.body(null, 204);
	});
