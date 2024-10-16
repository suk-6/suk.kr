"use server";

import { Value } from "@/lib/models/value";
import { get } from "@vercel/edge-config";
import { redirect } from "next/navigation";

export const checkPassword = async (key: string, password: string) => {
	let data: Value | undefined;

	try {
		data = await get(key);
	} catch (error) {
		console.error(error);
	}

	if (data) {
		if (data.password === password) redirect(data.redirectURL);
	}
};
