import { noteIdSchema } from "@suk/contracts";
import { Hono } from "hono";
import { z } from "zod";
import {
	deleteNote,
	getNote,
	getNotes,
	saveNote,
	setNotePassword,
} from "./repo";

const contentSchema = z.object({ content: z.string() });
const passwordSchema = z.object({ passwordHash: z.string().min(1).nullable() });
const id = (value: string) => noteIdSchema.parse(value);

export const notesRoute = new Hono<{ Bindings: Env }>()
	.get("/", async (context) => context.json(await getNotes(context.env.DB)))
	.get("/:id", async (context) => {
		const note = await getNote(context.env.DB, id(context.req.param("id")));
		return note
			? context.json(note)
			: context.json({ error: "Not found" }, 404);
	})
	.put("/:id", async (context) => {
		const noteId = id(context.req.param("id"));
		const { content } = contentSchema.parse(await context.req.json());
		if (new TextEncoder().encode(content).byteLength > 512 * 1024)
			return context.json({ error: "Note is too large" }, 413);
		return context.json(await saveNote(context.env.DB, noteId, content));
	})
	.put("/:id/password", async (context) => {
		const noteId = id(context.req.param("id"));
		const { passwordHash } = passwordSchema.parse(await context.req.json());
		return context.json(
			await setNotePassword(context.env.DB, noteId, passwordHash),
		);
	})
	.delete("/:id", async (context) => {
		await deleteNote(context.env.DB, id(context.req.param("id")));
		return context.body(null, 204);
	});
