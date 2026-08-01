import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

const name = "suk_admin";
const sign = (value: string) =>
	createHmac("sha256", process.env.SESSION_SECRET ?? "")
		.update(value)
		.digest("base64url");

export const isAdmin = async () => {
	const session = (await cookies()).get(name)?.value;
	if (!session) return false;
	const [expiresAt, signature] = session.split(".");
	if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
	const expected = Buffer.from(sign(expiresAt));
	const provided = Buffer.from(signature);
	return (
		expected.length === provided.length && timingSafeEqual(expected, provided)
	);
};

export const createSession = async () => {
	const expiresAt = String(Date.now() + 30 * 24 * 60 * 60 * 1000);
	(await cookies()).set(name, `${expiresAt}.${sign(expiresAt)}`, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		path: "/admin",
		maxAge: 30 * 24 * 60 * 60,
	});
};

export const clearSession = async () => (await cookies()).delete(name);
