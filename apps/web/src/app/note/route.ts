import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { api } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
	const consonants = "bcdfghjklmnpqrstvwxyz";
	const vowels = "aeiou";
	for (let attempt = 0; attempt < 20; attempt++) {
		const id = Array.from({ length: 6 }, (_, index) => {
			const letters = index % 2 ? vowels : consonants;
			return letters[randomInt(letters.length)];
		}).join("");
		if (!(await api.note(id))) {
			const response = NextResponse.redirect(
				new URL(`/note/${id}`, request.url),
			);
			response.headers.set("Cache-Control", "no-store");
			return response;
		}
	}
	return new Response("Could not create a note URL", {
		status: 503,
		headers: { "Cache-Control": "no-store" },
	});
};
