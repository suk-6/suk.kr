"use client";

import { updateDisabled } from "@/lib/edge-config";
import { Item } from "@/lib/models/item";
import { useEffect, useState } from "react";
import { TailSpin } from "react-loader-spinner";

export const ItemView = ({
	item,
	updateItems,
}: { item: Item; updateItems: () => Promise<void> }) => {
	const { slug, value } = item;
	const [isUpdating, setIsUpdating] = useState(false);

	const update = (disabled: boolean) => {
		setIsUpdating(true);
		updateDisabled(slug, { ...value!, disabled }).then(() => {
			updateItems().then(() => setIsUpdating(false));
		});
	};

	return (
		<div className="flex flex-row w-full">
			<div className="w-full flex text-center *:h-fit *:px-4 *:py-2">
				<span className="w-1/12 text-gray-800">{slug}</span>
				<span className="w-full text-left text-blue-500 hover:underline">
					{value!.redirectURL}
				</span>
				<span className="w-3/12 text-nowrap text-gray-500 text-sm">
					{value!.createdAt.toLocaleString()}
				</span>
				<div className="w-3/12 text-gray-600 blur-sm hover:blur-none">
					{value!.password ? value!.password : ""}
				</div>
			</div>
			<div className="w-1/12 flex items-center justify-center">
				{isUpdating ? (
					<div>
						<TailSpin wrapperClass="*:h-4" width={24} color="#696969" />
					</div>
				) : (
					<input
						type="checkbox"
						className="form-checkbox h-4 w-4 text-blue-500"
						checked={value!.disabled}
						onChange={() => update(!value!.disabled)}
					/>
				)}
			</div>
		</div>
	);
};
