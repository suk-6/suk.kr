import { getItems } from "@/lib/actions/item/getAll";
import { Item } from "@/lib/models/item";
import { Items } from "@/lib/models/items";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { columns } from "./columns";

export const ItemsView = () => {
	const [items, setItems] = useState<Items>({});

	useEffect(() => {
		updateItems();
	}, []);

	const updateItems = async () =>
		await getItems().then((data) => setItems(data as unknown as Items));

	const table = useReactTable<Item>({
		columns,
		data: Object.entries(items).map(([slug, value]) => ({ slug, value })),
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="p-2">
			<table>
				<thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th key={header.id}>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr key={row.id}>
							{row.getVisibleCells().map((cell) => (
								<td key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
