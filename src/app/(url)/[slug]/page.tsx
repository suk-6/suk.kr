import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RequiresPassword } from "./auth";

type Status = "not-found" | "requires-password";

export default function Page() {
	const headersList = headers();
	const status = headersList.get("Suk-status") as Status;

	if (status === "not-found") {
		return notFound();
	} else if (status === "requires-password") {
		return <RequiresPassword />;
	} else {
		throw new Error("Invalid status");
	}
}
