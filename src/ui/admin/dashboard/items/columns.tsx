import { Item } from "@/lib/models/item";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<Item>();

export const columns = [
	columnHelper.accessor("slug", {
		cell: (info) => info.getValue(),
		header: "Slug",
	}),
	columnHelper.accessor("value.redirectURL", {
		cell: (info) => {
			const password = info.getValue();
			return (
				<a href={password} className="text-left text-blue-500 hover:underline">
					{password.length > 60 ? `${password.substring(0, 60)}...` : password}
				</a>
			);
		},
		header: "Redirect URL",
	}),
	columnHelper.accessor("value.createdAt", {
		cell: (info) => (
			<p className="text-center">
				{new Date(info.getValue()).toLocaleString()},
			</p>
		),
		header: "Created At",
	}),
	columnHelper.accessor("value.password", {
		cell: (info) => (
			<div className="text-center text-gray-600 blur-sm hover:blur-none">
				{info.getValue() ? info.getValue() : ""}
			</div>
		),
		header: "Password",
	}),
];
