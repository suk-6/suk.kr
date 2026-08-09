import { LogOut } from "lucide-react";
import Link from "next/link";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { logout } from "@/lib/auth/actions";
import { type Section, sections } from "./config";

export const AdminNav = ({ active }: { active: Section }) => (
	<Sidebar collapsible="icon">
		<SidebarHeader>
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						render={<Link href="/admin" />}
						tooltip="suk.kr admin"
					>
						<div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
							S
						</div>
						<span className="font-semibold">suk.kr admin</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						{sections.map(({ id, label, icon: Icon }) => (
							<SidebarMenuItem key={id}>
								<SidebarMenuButton
									isActive={active === id}
									render={<Link href={`/admin?section=${id}`} />}
									tooltip={label}
								>
									<Icon />
									<span>{label}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
		<SidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<form action={logout}>
						<SidebarMenuButton type="submit" tooltip="로그아웃">
							<LogOut />
							<span>로그아웃</span>
						</SidebarMenuButton>
					</form>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
		<SidebarRail />
	</Sidebar>
);
