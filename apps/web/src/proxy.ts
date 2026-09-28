import { NextResponse, type NextRequest, userAgent } from "next/server";

export function proxy(request: NextRequest) {
	if (request.headers.has("next-action")) return NextResponse.next();
	if (
		(request.method !== "GET" && request.method !== "HEAD") ||
		!userAgent(request).browser.name
	) {
		const url = request.nextUrl.clone();
		url.pathname += "/raw";
		return NextResponse.rewrite(url);
	}
	return NextResponse.next();
}

export const config = { matcher: ["/note/:id"] };
