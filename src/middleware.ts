import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";
import { Value } from "./models/value";

export const config = {
	matcher: "/((?!api|_next/static|_next/image|favicon.ico|admin).*)",
};

export async function middleware(request: NextRequest) {
	let data: Value | undefined;
	const slug = request.nextUrl.pathname.substring(1);
	console.log("slug:", slug);

	try {
		data = await get(slug);
	} catch (error) {
		console.error(error);
	}

	const response = NextResponse.next();

	if (data) {
		if (data.password) {
			response.headers.append("Suk-status", "requires-password");
			return response;
		}

		return NextResponse.redirect(data.redirectURL, 301);
	} else {
		response.headers.append("Suk-status", "not-found");
		return response;
	}
}
