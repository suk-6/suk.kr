"use client";

import { Logout } from "@/ui/components/dashboard/logout";
import { ItemsView } from "./items";

export const Dashboard = () => {
	return (
		<main className="fixed w-screen h-screen flex flex-col">
			<nav className="px-4 py-2 border-b-2 flex justify-between">
				<h2 className="text-2xl font-semibold">Dashboard</h2>
				<Logout />
			</nav>
			<div className="flex flex-col w-full h-full overflow-hidden px-36 py-10">
				<div className="w-full h-32"></div>
				<ItemsView />
			</div>
		</main>
	);
};
