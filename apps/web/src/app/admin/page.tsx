import { type Section, sections } from "@/features/admin/config";
import { getAdminData } from "@/features/admin/data";
import { AdminLogin } from "@/features/admin/login";
import { AdminPage } from "@/features/admin/page";
import { isAdmin } from "@/lib/auth/session";

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ section?: string; error?: string }>;
}) {
	const query = await searchParams;
	if (!(await isAdmin()))
		return <AdminLogin invalid={query.error === "invalid"} />;
	const section = (
		sections.some(({ id }) => id === query.section) ? query.section : "overview"
	) as Section;
	return <AdminPage section={section} data={await getAdminData()} />;
}
