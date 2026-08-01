import { fileSchema, fileUpdateSchema } from "@suk/contracts";
import { Hono } from "hono";
import { createFile, deleteFile, getFiles, updateFile } from "./repo";

export const filesRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) => context.json(await getFiles(context.env.DB)))
	.post("/", async (context) => {
		const value = fileSchema.parse(await context.req.json());
		await createFile(context.env.DB, value);
		return context.json(value, 201);
	})
	.patch("/:id", async (context) => {
		const value = fileUpdateSchema.parse(await context.req.json());
		await updateFile(
			context.env.DB,
			context.req.param("id"),
			value.slug,
			value.fileName,
		);
		return context.json(value);
	})
	.delete("/:id", async (context) => {
		await deleteFile(context.env.DB, context.req.param("id"));
		return context.body(null, 204);
	});
