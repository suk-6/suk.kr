import { createHash } from "crypto";
import { cookies } from "next/headers";

export const checkAdmin = () => {
	const adminHash = createHash("sha512")
		.update(process.env.PASSWORD as string)
		.digest("hex");
	const session = cookies().get("session");

	if (session?.value === adminHash) {
		return true;
	} else return false;
};
