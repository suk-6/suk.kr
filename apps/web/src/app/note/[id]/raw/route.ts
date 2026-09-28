import { noteIdSchema } from "@suk/contracts";
import { api } from "@/lib/api/client";
import { verifyPassword } from "@/lib/crypto/password";

export const dynamic = "force-dynamic";

const headers = {
	"Content-Type": "text/plain; charset=utf-8",
	"Cache-Control": "no-store",
};

const authenticate = (authorization: string | null, hash: string) => {
	if (!authorization?.startsWith("Basic ")) return false;
	const value = Buffer.from(authorization.slice(6), "base64").toString("utf8");
	const colon = value.indexOf(":");
	return colon >= 0 && verifyPassword(value.slice(colon + 1), hash);
};

const handle = async (
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) => {
	const { id } = await params;
	if (!noteIdSchema.safeParse(id).success)
		return new Response("Invalid note ID\n", { status: 404, headers });
	const note = await api.note(id);
	if (
		note?.passwordHash &&
		!authenticate(request.headers.get("authorization"), note.passwordHash)
	)
		return new Response("Authentication required\n", {
			status: 401,
			headers: { ...headers, "WWW-Authenticate": 'Basic realm="note"' },
		});
	if (request.method === "GET")
		return new Response(note?.content ?? "", { headers });
	const declaredSize = Number(request.headers.get("content-length") ?? 0);
	if (declaredSize > 512 * 1024)
		return new Response("Note is too large\n", { status: 413, headers });
	const bytes = await request.arrayBuffer();
	if (bytes.byteLength > 512 * 1024)
		return new Response("Note is too large\n", { status: 413, headers });
	let content: string;
	try {
		content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return new Response("Invalid UTF-8\n", { status: 400, headers });
	}
	await api.mutate(`/notes/${id}`, "PUT", { content });
	return new Response("Saved\n", { headers });
};

export const GET = handle;
export const PUT = handle;
export const POST = handle;
