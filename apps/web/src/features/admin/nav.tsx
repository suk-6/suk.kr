import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { type Section, sections } from "./config";

export const AdminNav = ({ active }: { active: Section }) => (
	<aside className="flex w-full flex-col border-b border-zinc-200 bg-white p-4 lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
		<a
			href="/admin"
			className="mb-5 px-3 py-2 text-lg font-semibold tracking-tight"
		>
			suk.kr <span className="text-zinc-400">v2</span>
		</a>
		<nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-1 lg:flex-col">
			{sections.map(({ id, label, icon: Icon }) => (
				<a
					key={id}
					href={`/admin?section=${id}`}
					className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active === id ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
				>
					<Icon size={16} />
					{label}
				</a>
			))}
		</nav>
		<form action={logout} className="mt-4">
			<Button
				variant="ghost"
				className="w-full justify-start gap-3 text-zinc-500"
			>
				<LogOut size={16} />
				로그아웃
			</Button>
		</form>
	</aside>
);
