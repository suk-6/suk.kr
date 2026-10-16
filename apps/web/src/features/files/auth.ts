import { isAdmin } from "@/lib/auth/session";

export const fileAuthorization = async (request: Request) => {
	if (!(await isAdmin()))
		return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
	const url = new URL(request.url);
	const host =
		request.headers.get("x-forwarded-host") ||
		request.headers.get("host") ||
		url.host;
	const protocol =
		request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);
	if (
		request.method !== "GET" &&
		request.headers.get("origin") !== `${protocol}://${host}`
	)
		return Response.json(
			{ error: "같은 사이트에서만 파일을 변경할 수 있습니다." },
			{ status: 403 },
		);
	if (
		["POST", "PATCH"].includes(request.method) &&
		request.headers.get("content-type")?.split(";")[0].trim() !==
			"application/json"
	)
		return Response.json({ error: "JSON 요청이 필요합니다." }, { status: 415 });
	return null;
};
