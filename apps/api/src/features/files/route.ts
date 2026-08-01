import { fileSchema, fileUpdateSchema } from "@suk/contracts";
import { Hono } from "hono";
import { createFile, deleteFile, getFile, getFiles, updateFile } from "./repo";

export const filesRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) => context.json(await getFiles(context.env.DB)))
	.get("/:id", async (context) => {
		const value = await getFile(context.env.DB, context.req.param("id"));
		return value
			? context.json(value)
			: context.json({ error: "File not found" }, 404);
	})
	.post("/", async (context) => {
		const value = fileSchema.parse(await context.req.json());
		await createFile(context.env.DB, value);
		return context.json(value, 201);
	})
	.patch("/:id", async (context) => {
		const value = fileUpdateSchema.parse(await context.req.json());
		const updated = await updateFile(
			context.env.DB,
			context.req.param("id"),
			value.slug,
			value.fileName,
		);
		return context.json(updated);
	})
	.delete("/:id", async (context) => {
		return context.json(
			await deleteFile(context.env.DB, context.req.param("id")),
		);
	});
