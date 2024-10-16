import { Value } from "../models/value";
import { request } from "./request";

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
				createdAt: new Date(),
			},
			operation: "create",
		},
	]);
