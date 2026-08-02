import { noticeSchema } from "@suk/contracts";
import { Hono } from "hono";
import { deleteNotice, getNotices, saveNotice } from "./repo";

export const noticesRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) =>
		context.json(await getNotices(context.env.DB, true)),
	)
	.put("/:id", async (context) => {
		const value = noticeSchema.parse({
			...(await context.req.json()),
			id: context.req.param("id"),
		});
		await saveNotice(context.env.DB, value);
		return context.json(value);
	})
	.delete("/:id", async (context) => {
		await deleteNotice(context.env.DB, context.req.param("id"));
		return context.body(null, 204);
	});
