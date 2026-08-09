import { entryBatchSchema, entrySchema } from "@suk/contracts";
import { Hono } from "hono";
import { deleteEntry, getEntries, saveEntries, saveEntry } from "./repo";

export const entriesRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) =>
		context.json(await getEntries(context.env.DB, true)),
	)
	.put("/", async (context) => {
		const value = entryBatchSchema.parse(await context.req.json());
		await saveEntries(context.env.DB, value.upsert, value.remove);
		return context.json(value);
	})
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
