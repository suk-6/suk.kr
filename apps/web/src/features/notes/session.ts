import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

const name =
	process.env.NODE_ENV === "production" ? "__Secure-suk_note" : "suk_note";
const sign = (id: string, hash: string, expires: string) => {
	if (!process.env.SESSION_SECRET)
		throw new Error("SESSION_SECRET is not configured");
	return createHmac("sha256", process.env.SESSION_SECRET)
		.update(`${id}\0${hash}\0${expires}`)
		.digest("base64url");
};

export const isNoteUnlocked = async (id: string, hash: string) => {
	const value = (await cookies()).get(name)?.value;
	if (!value) return false;
	const [expires, signature] = value.split(".");
	if (!expires || !signature || Number(expires) < Date.now()) return false;
	const expected = Buffer.from(sign(id, hash, expires));
	const provided = Buffer.from(signature);
	return (
		expected.length === provided.length && timingSafeEqual(expected, provided)
	);
};

export const setNoteUnlocked = async (id: string, hash: string | null) => {
	const store = await cookies();
	const path = `/note/${id}`;
	if (!hash) {
		store.set(name, "", { path, maxAge: 0 });
		return;
	}
	const expires = String(Date.now() + 30 * 24 * 60 * 60 * 1000);
	store.set(name, `${expires}.${sign(id, hash, expires)}`, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path,
		maxAge: 30 * 24 * 60 * 60,
		priority: "high",
	});
};
