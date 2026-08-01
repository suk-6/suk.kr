import { entrySchema } from "@suk/contracts";
import { Hono } from "hono";
import { deleteEntry, getEntries, saveEntry } from "./repo";

export const entriesRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) =>
		context.json(await getEntries(context.env.DB, true)),
	)
	.put("/:id", async (context) => {
		const value = entrySchema.parse({
			...(await context.req.json()),
			id: context.req.param("id"),
		});
		await saveEntry(context.env.DB, value);
		return context.json(value);
	})
	.delete("/:id", async (context) => {
		await deleteEntry(context.env.DB, context.req.param("id"));
		return context.body(null, 204);
	});
