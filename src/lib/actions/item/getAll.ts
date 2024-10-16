"use server";

import { getAll } from "@vercel/edge-config";

export const getItems = async () => await getAll();
