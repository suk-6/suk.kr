import { Item } from "@/lib/models/item";

export const ItemView = ({ slug, value }: Item) => (
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
				{value!.password ? value!.password : "-"}
			</div>
		</div>
		<div className="w-1/12 flex items-center justify-center">
			<input
				type="checkbox"
				className="form-checkbox h-4 w-4 text-blue-500"
				checked={value!.disabled}
				// onChange={handleDisableChange}
			/>
		</div>
	</div>
);
