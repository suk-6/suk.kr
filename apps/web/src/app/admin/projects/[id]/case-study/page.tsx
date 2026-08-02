import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CaseStudyEditor } from "@/features/admin/caseStudyEditor";
import { api } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
	title: "Case Study Editor",
	robots: { index: false, follow: false },
};

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ saved?: string }>;
}) {
	if (!(await isAdmin())) redirect("/admin");
	const { id } = await params;
	const project = (await api.projects()).find((value) => value.id === id);
	if (!project) notFound();
	return (
		<CaseStudyEditor
			project={project}
			saved={(await searchParams).saved === "1"}
		/>
	);
}
