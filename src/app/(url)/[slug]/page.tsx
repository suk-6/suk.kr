import { Value } from "@/lib/models/value";
import { get } from "@vercel/edge-config";
import { RedirectType, notFound, redirect } from "next/navigation";
import { RequiresPassword } from "../../../ui/url/password";

export default async function Page({ params }: { params: { slug: string } }) {
	let data: Value | undefined;

	try {
		data = await get(params.slug);
	} catch (error) {
		console.error(error);
	}

	if (data) {
		if (data.password) return <RequiresPassword />;

		return redirect(data.redirectURL, RedirectType.replace);
	}

	return notFound();
}
