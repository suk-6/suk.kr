import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { ZodError } from "zod";
import { entriesRoute } from "./features/entries/route";
import { filesRoute } from "./features/files/route";
import { linksRoute } from "./features/links/route";
import { noticesRoute } from "./features/notices/route";
import { portfolioRoute } from "./features/portfolio/route";
import { projectsRoute } from "./features/projects/route";
import { settingsRoute } from "./features/settings/route";
import { skillsRoute } from "./features/skills/route";
import { auth } from "./shared/auth";
import { ApiError } from "./shared/error";

export const app = new Hono<{ Bindings: Env }>();

app.get("/health", (context) =>
	context.json({ ok: true, service: "api-suk-kr" }),
);
app.use("*", auth());
app.use(
	"*",
	bodyLimit({
		maxSize: 64 * 1024,
		onError: (context) =>
			context.json({ error: "Request body is too large" }, 413),
	}),
);
app.use("*", async (context, next) => {
	const startedAt = Date.now();
	await next();
	console.log(
		JSON.stringify({
			method: context.req.method,
			path: context.req.path,
			status: context.res.status,
			durationMs: Date.now() - startedAt,
		}),
	);
});
app.route("/portfolio", portfolioRoute);
app.route("/settings", settingsRoute);
app.route("/projects", projectsRoute);
app.route("/entries", entriesRoute);
app.route("/skills", skillsRoute);
app.route("/links", linksRoute);
app.route("/files", filesRoute);
app.route("/notices", noticesRoute);
app.notFound((context) => context.json({ error: "Not found" }, 404));
app.onError((error, context) => {
	console.error(
		JSON.stringify({
			message: "request failed",
			error: error.message,
			path: context.req.path,
		}),
	);
	if (error instanceof ZodError)
		return context.json(
			{ error: "Invalid request", issues: error.issues },
			400,
		);
	if (error instanceof ApiError)
		return context.json({ error: error.message }, error.status);
	if (error.message.includes("UNIQUE constraint failed"))
		return context.json({ error: "이미 사용 중인 값입니다." }, 409);
	return context.json({ error: "Internal server error" }, 500);
});
