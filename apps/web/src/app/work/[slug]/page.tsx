import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyPage } from "@/features/caseStudy/page";
import { api } from "@/lib/api/client";

export const dynamic = "force-dynamic";

const getProject = async (slug: string) => {
	const { projects } = await api.portfolio();
	const index = projects.findIndex((project) => project.slug === slug);
	if (index === -1) return null;
	return {
		project: projects[index],
		nextProject: projects[(index + 1) % projects.length],
	};
};

export const generateMetadata = async ({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
	const value = await getProject((await params).slug);
	if (!value) return { title: "프로젝트를 찾을 수 없습니다" };
	return {
		title: value.project.name,
		description: value.project.subtitle || value.project.description,
		openGraph: value.project.coverUrl
			? { images: [{ url: value.project.coverUrl }] }
			: undefined,
	};
};

export default async function Page({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const value = await getProject((await params).slug);
	if (!value) notFound();
	return <CaseStudyPage {...value} />;
}
