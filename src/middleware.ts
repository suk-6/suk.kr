import { get } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";
import { Value } from "./lib/models/value";

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

	if (data) {
		if (data.password) return requiresPassword();
		if (data.disabled) return notFound();

		return NextResponse.redirect(data.redirectURL, 301);
	}

	return notFound();
}

export const notFound = () => {
	const response = NextResponse.next();
	response.headers.append("Suk-status", "not-found");
	return response;
};

export const requiresPassword = () => {
	const response = NextResponse.next();
	response.headers.append("Suk-status", "requires-password");
	return response;
};
