import { LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { type Section, sections } from "./config";

export const AdminNav = ({ active }: { active: Section }) => (
	<aside className="flex w-full flex-col border-b border-sidebar-border bg-sidebar p-3 text-sidebar-foreground lg:fixed lg:inset-y-0 lg:w-60 lg:border-r lg:border-b-0">
		<Link href="/admin" className="mb-4 px-2 py-2 text-sm font-medium">
			suk.kr admin
		</Link>
		<nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-1 lg:flex-col">
			{sections.map(({ id, label, icon: Icon }) => (
				<Link
					key={id}
					href={`/admin?section=${id}`}
					className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${active === id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
				>
					<Icon size={16} />
					{label}
				</Link>
			))}
		</nav>
		<form action={logout} className="mt-4">
			<Button
				variant="ghost"
				className="w-full justify-start text-muted-foreground"
			>
				<LogOut size={16} />
				로그아웃
			</Button>
		</form>
	</aside>
);
