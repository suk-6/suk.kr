"use client";

import { useEffect } from "react";

export default function NotFound() {
	useEffect(() => {
		setTimeout(() => {
			location.href = "/";
		}, 5000);
	}, []);

	return (
		<main className="relative w-screen h-screen flex justify-center items-center">
			<div className=" flex flex-col gap-1 text-center">
				<h2 className="text-3xl font-bold">Not Found</h2>
				<p>Could not find requested resource.</p>
			</div>
		</main>
	);
}
