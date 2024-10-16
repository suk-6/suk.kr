import { getItems } from "@/lib/actions/item/getAll";
import { Items } from "@/lib/models/items";
import { useEffect, useState } from "react";
import { ItemView } from "./item";

export const ItemsView = () => {
	const [items, setItems] = useState<Items>({});

	useEffect(() => {
		getItems().then((data) => setItems(data as unknown as Items));
	}, []);

	return (
		<div className="w-full h-full overflow-hidden border-2 border-gray-300">
			<div className="w-full h-full *:w-full flex flex-col overflow-hidden">
				<div className="flex text-center *:font-medium *:h-fit *:px-4 *:py-2">
					<span className="w-1/12">Slug</span>
					<span className="w-full text-left">Redirect URL</span>
					<span className="w-3/12">Created At</span>
					<span className="w-3/12">Password</span>
					<span className="w-1/12">Disabled</span>
				</div>
				<div className="border border-gray-300" />
				<div className="*:w-full overflow-y-scroll scrollbar-hide">
					{Object.keys(items).length === 0 ? (
						<p className="text-center p-4">No items found.</p>
					) : (
						Object.entries(items).map(([key, value]) => (
							<ItemView key={key} slug={key} value={value} />
						))
					)}
					{Array.from({ length: 100 }).map((_, i) => {
						return Object.entries(items).map(([key, value]) => (
							<ItemView key={i} slug={key} value={value} />
						));
					})}
				</div>
			</div>
		</div>
	);
};
