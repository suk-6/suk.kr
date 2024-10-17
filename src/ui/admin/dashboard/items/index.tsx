import { deleteItem } from "@/lib/edge-config";
import { Item } from "@/lib/models/item";
import { Items } from "@/lib/models/items";
import {
	TableMeta,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { MdDelete } from "react-icons/md";
import { columns } from "./columns";

interface CustomTableMeta extends TableMeta<Item> {
	removeRow: (item: Item) => void;
}

export const ItemsView = ({
	items,
	updateItems,
}: { items: Items; updateItems: () => Promise<void> }) => {
	const data = useMemo(
		() =>
			Object.entries(items)
				.map(([slug, value]) => ({ slug, value }))
				.sort((a, b) => {
					const aDate = new Date(a.value.createdAt).getTime();
					const bDate = new Date(b.value.createdAt).getTime();
					return bDate - aDate;
				}),
		[items],
	);

	const table = useReactTable<Item>({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		meta: {
			removeRow: ({ slug }: Item) => {
				confirm(`Are you sure you want to delete this item?\nSlug: ${slug}`) &&
					deleteItem(slug).then(() => updateItems());
			},
		} as CustomTableMeta,
	});

	return (
		<div className="h-full p-2 border-2 border-gray-300 overflow-y-scroll scrollbar-hide">
			<table className="w-full *:w-full">
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
						<tr key={row.id} className="h-8">
							{row.getVisibleCells().map((cell) => {
								return (
									<td key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								);
							})}
							<td className="text-center">
								<button
									onClick={() =>
										(table.options.meta as CustomTableMeta).removeRow(
											row.original,
										)
									}
								>
									<MdDelete />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
