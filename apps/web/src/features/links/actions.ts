"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { api } from "@/lib/api/client";
import { verifyPassword } from "@/lib/crypto/password";

export const unlock = async (slug: string, data: FormData) => {
	const link = await api.link(slug);
	if (
		link.passwordHash &&
		verifyPassword(String(data.get("password") ?? ""), link.passwordHash)
	)
		redirect(link.targetUrl as Route);
	redirect(`/${encodeURIComponent(slug)}?error=invalid`);
};
