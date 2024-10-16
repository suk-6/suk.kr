"use server";

import { Item } from "@/models/item";

type Operation = "create" | "update" | "upsert" | "delete";
type FetchItem = Item & {
	operation: Operation;
};

export const request = async (items: FetchItem[]) =>
	await fetch(
		`https://api.vercel.com/v1/edge-config/${
			process.env.EDGE_CONFIG_ID as string
		}/items`,
		{
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${process.env.VERCEL_API_KEY as string}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				items: [...items],
			}),
		},
	).then((res) => res.json());
