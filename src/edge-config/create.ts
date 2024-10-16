import { Item } from "@/models/item";
import { request } from "./request";

export const createItem = async (item: Item) =>
	await request([
		{
			...item,
			operation: "create",
		},
	]);
