"use server";

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const loginAdmin = (password: string) => {
	if (password === process.env.PASSWORD) {
		cookies().set(
			"session",
			createHash("sha512").update(password).digest("hex"),
			{
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				maxAge: 60 * 60 * 24 * 30, // One month
				path: "/",
			},
		);

		return redirect("/admin");
	}
};
