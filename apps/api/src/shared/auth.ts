import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

const digest = (value: string) =>
	crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));

export const auth =
	(): MiddlewareHandler<{ Bindings: Env }> => async (context, next) => {
		const provided =
			context.req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
		const [providedHash, expectedHash] = await Promise.all([
			digest(provided),
			digest(context.env.API_TOKEN),
		]);

		if (
			!timingSafeEqual(
				new Uint8Array(providedHash),
				new Uint8Array(expectedHash),
			)
		) {
			return context.json({ error: "Unauthorized" }, 401);
		}

		await next();
	};
