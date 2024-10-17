import { Item } from "@/lib/models/item";
import { Items } from "@/lib/models/items";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { columns } from "./columns";

export const ItemsView = ({ items }: { items: Items }) => {
	const table = useReactTable<Item>({
		columns,
		data: Object.entries(items).map(([slug, value]) => ({ slug, value })),
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="p-2">
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
