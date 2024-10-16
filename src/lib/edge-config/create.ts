import { Item } from "@/lib/models/item";
import { request } from "./request";

export const createItem = async (item: Item) =>
	await request([
		{
			key: item.slug,
			value: item.value,
			operation: "create",
		},
	]);
