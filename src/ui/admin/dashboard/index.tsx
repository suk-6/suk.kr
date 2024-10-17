"use client";

import { Logout } from "@/ui/components/button/logout";
import { CreateView } from "./create";
import { ItemsView } from "./items";
import { Items } from "@/lib/models/items";
import { useEffect, useState } from "react";
import { getItems } from "@/lib/actions/item/getAll";

export const Dashboard = () => {
	const [items, setItems] = useState<Items>({});

	useEffect(() => {
		updateItems();
	}, []);

	const updateItems = async () =>
		await getItems().then((data) => setItems(data as unknown as Items));

	return (
		<main className="fixed w-screen h-screen flex flex-col">
			<nav className="px-4 py-2 border-b-2 flex justify-between">
				<h2 className="text-2xl font-semibold">Dashboard</h2>
				<Logout />
			</nav>
			<div className="flex flex-col gap-3 w-full h-full overflow-hidden px-36 py-10">
				<CreateView updateItems={updateItems} />
				<ItemsView items={items} />
			</div>
		</main>
	);
};
