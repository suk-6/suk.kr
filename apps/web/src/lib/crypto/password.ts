import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import "server-only";

export const hashPassword = (password: string) => {
	if (!password) return null;
	const salt = randomBytes(16).toString("hex");
	return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};

export const verifyPassword = (password: string, stored: string) => {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	const expected = Buffer.from(hash, "hex");
	const provided = scryptSync(password, salt, 64);
	return (
		expected.length === provided.length && timingSafeEqual(expected, provided)
	);
};
