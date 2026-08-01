import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { Password } from "@/features/links/password";
import { api } from "@/lib/api/client";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ error?: string }>;
}) {
	const { slug } = await params;
	const link = await api.link(slug).catch(() => null);
	if (!link) notFound();
	if (link.passwordHash)
		return (
			<Password
				slug={slug}
				invalid={(await searchParams).error === "invalid"}
			/>
		);
	redirect(link.targetUrl as Route);
}
