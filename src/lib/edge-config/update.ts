import { Value } from "../models/value";
import { request } from "./request";

export const updateDisabled = async (slug: string, value: Value) => {
	await request([
		{
			key: slug,
			value,
			operation: "update",
		},
	]);
};
