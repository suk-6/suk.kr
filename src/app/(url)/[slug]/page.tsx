import { notFound, redirect, RedirectType } from "next/navigation";
import { RequiresPassword } from "../../../ui/url/password";
import { get } from "@vercel/edge-config";
import { Value } from "@/lib/models/value";

export default async function Page({ params }: { params: { slug: string } }) {
	let data: Value | undefined;

	try {
		data = await get(params.slug);
	} catch (error) {
		console.error(error);
	}

	if (data) {
		if (data.password) return <RequiresPassword />;
		if (data.disabled) return notFound();

		return redirect(data.redirectURL, RedirectType.replace);
	}
}
