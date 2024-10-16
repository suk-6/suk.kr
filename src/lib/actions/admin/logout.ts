"use server";

import { cookies } from "next/headers";

export const logoutAdmin = () => cookies().delete("session");
