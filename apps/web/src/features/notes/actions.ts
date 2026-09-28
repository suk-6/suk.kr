"use server";

import { noteIdSchema } from "@suk/contracts";
import { api } from "@/lib/api/client";
import { hashPassword, verifyPassword } from "@/lib/crypto/password";
import { isNoteUnlocked, setNoteUnlocked } from "./session";

export const unlockNote = async (id: string, secret: string) => {
	noteIdSchema.parse(id);
	const note = await api.note(id);
	if (!note?.passwordHash || !verifyPassword(secret, note.passwordHash))
		return { ok: false, content: "" };
	await setNoteUnlocked(id, note.passwordHash);
	return { ok: true, content: note.content };
};

export const saveNote = async (id: string, content: string) => {
	noteIdSchema.parse(id);
	if (new TextEncoder().encode(content).byteLength > 512 * 1024)
		throw new Error("노트는 512 KiB까지 저장할 수 있습니다.");
	const note = await api.note(id);
	if (note?.passwordHash && !(await isNoteUnlocked(id, note.passwordHash)))
		throw new Error("잠긴 노트입니다. 다시 잠금을 해제하세요.");
	await api.mutate(`/notes/${id}`, "PUT", { content });
};

export const changeNotePassword = async (id: string, secret: string) => {
	noteIdSchema.parse(id);
	const note = await api.note(id);
	if (note?.passwordHash && !(await isNoteUnlocked(id, note.passwordHash)))
		throw new Error("잠긴 노트입니다. 다시 잠금을 해제하세요.");
	const hash = hashPassword(secret);
	await api.mutate(`/notes/${id}/password`, "PUT", { passwordHash: hash });
	await setNoteUnlocked(id, hash);
	return Boolean(hash);
};
