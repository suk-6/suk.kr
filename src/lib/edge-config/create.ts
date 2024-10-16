import { request } from "./request";
import { Value } from "../models/value";

class CreateItem implements Pick<Value, "redirectURL" | "password"> {
	slug: string = "";
	redirectURL: string = "";
	password: string | null = null;
}

export const createItem = async (item: CreateItem) =>
	await request([
		{
			key: item.slug,
			value: {
				redirectURL: item.redirectURL,
				password: item.password,
				disabled: false,
				createdAt: new Date(),
			},
			operation: "create",
		},
	]);
