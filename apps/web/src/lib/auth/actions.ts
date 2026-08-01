"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { clearSession, createSession } from "./session";

const digest = (value: string) => createHash("sha256").update(value).digest();

export const login = async (formData: FormData) => {
	if (!process.env.ADMIN_PASSWORD)
		throw new Error("ADMIN_PASSWORD is not configured");
	const provided = digest(String(formData.get("password") ?? ""));
	const expected = digest(process.env.ADMIN_PASSWORD);
	if (!timingSafeEqual(provided, expected)) redirect("/admin?error=invalid");
	await createSession();
	redirect("/admin");
};

export const logout = async () => {
	await clearSession();
	redirect("/admin");
};
