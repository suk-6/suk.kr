"use client";

export default function Error() {
	return (
		<main className="relative w-screen h-screen flex justify-center items-center">
			<div className=" flex flex-col gap-1 text-center">
				<h2 className="text-3xl font-bold">Error</h2>
				<p>Something went wrong! Please try again later or contact support.</p>
			</div>
		</main>
	);
}
