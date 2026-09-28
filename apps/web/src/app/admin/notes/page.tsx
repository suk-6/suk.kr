import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminLogin } from "@/features/admin/login";
import { AdminNav } from "@/features/admin/nav";
import { NotesTable } from "@/features/admin/notes/table";
import { api } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
	title: "Notes Admin",
	robots: { index: false, follow: false },
};

export default async function Page() {
	if (!(await isAdmin())) return <AdminLogin invalid={false} />;
	const notes = await api.notes();
	return (
		<SidebarProvider className="font-normal">
			<AdminNav active="notes" />
			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<span className="text-sm font-medium">노트 관리</span>
				</header>
				<div className="mx-auto w-full max-w-6xl p-4 sm:p-8 lg:p-10">
					<h1 className="mb-8 text-3xl font-semibold tracking-tight">
						노트 관리
					</h1>
					<NotesTable notes={notes} />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
