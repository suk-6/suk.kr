import { noteIdSchema } from "@suk/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoteEditor } from "@/features/notes/editor";
import { isNoteUnlocked } from "@/features/notes/session";
import { api } from "@/lib/api/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
	title: "Note",
	robots: { index: false, follow: false },
};

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	if (!noteIdSchema.safeParse(id).success) notFound();
	const note = await api.note(id);
	const locked = Boolean(
		note?.passwordHash && !(await isNoteUnlocked(id, note.passwordHash)),
	);
	return (
		<NoteEditor
			id={id}
			initialContent={locked ? "" : (note?.content ?? "")}
			initialLocked={locked}
			hasPassword={Boolean(note?.passwordHash)}
		/>
	);
}
