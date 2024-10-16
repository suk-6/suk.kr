import { request } from "./request";

export const deleteItem = async (key: string) =>
	await request([
		{
			key,
			value: null,
			operation: "delete",
		},
	]);
