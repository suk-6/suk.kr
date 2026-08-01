import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

const name =
	process.env.NODE_ENV === "production" ? "__Host-suk_admin" : "suk_admin";
const secret = () => {
	if (!process.env.SESSION_SECRET)
		throw new Error("SESSION_SECRET is not configured");
	return process.env.SESSION_SECRET;
};
const sign = (value: string) =>
	createHmac("sha256", secret()).update(value).digest("base64url");

export const isAdmin = async () => {
	const session = (await cookies()).get(name)?.value;
	if (!session) return false;
	const [expiresAt, signature] = session.split(".");
	const expires = Number(expiresAt);
	if (
		!expiresAt ||
		!signature ||
		!Number.isSafeInteger(expires) ||
		expires < Date.now()
	)
		return false;
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
		path: "/",
		maxAge: 30 * 24 * 60 * 60,
		priority: "high",
	});
};

export const clearSession = async () => (await cookies()).delete(name);
