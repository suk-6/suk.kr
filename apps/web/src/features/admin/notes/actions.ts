"use server";

import { noteIdSchema } from "@suk/contracts";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/session";

export const removeNote = async (data: FormData) => {
	if (!(await isAdmin())) throw new Error("Unauthorized");
	const id = noteIdSchema.parse(data.get("id"));
	await api.mutate(`/notes/${id}`, "DELETE");
	revalidatePath("/admin/notes");
};
