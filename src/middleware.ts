import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";
import { Value } from "./models/value";

export const config = {
	matcher: "/((?!api|_next/static|_next/image|favicon.ico|admin).*)",
};

export async function middleware(request: NextRequest) {
	let data: Value | undefined;
	const slug = request.nextUrl.pathname.substring(1);
	const headers = new Headers(request.headers);

	try {
		data = await get(slug);
	} catch {
		headers.set("Suk-status", "not-found");

		return NextResponse.next({
			request: {
				headers: headers,
			},
		});
	}

	if (data) {
		if (data.password) {
			headers.set("Suk-status", "requires-password");

			return NextResponse.next({
				request: {
					headers: headers,
				},
			});
		}

		return NextResponse.redirect(data.redirectURL, 301);
	}
}
