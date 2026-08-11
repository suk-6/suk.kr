import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { entrySections, type Section, sections } from "./config";
import type { AdminData } from "./data";
import { AdminNav } from "./nav";
import { EntriesSection } from "./sections/entries";
import { FilesSection } from "./sections/files";
import { LinksSection } from "./sections/links";
import { NoticesSection } from "./sections/notices";
import { OverviewSection } from "./sections/overview";
import { ProjectsSection } from "./sections/projects";
import { SettingsSection } from "./sections/settings";
import { SkillsSection } from "./sections/skills";

export const AdminPage = ({
	section,
	data,
}: {
	section: Section;
	data: AdminData;
}) => (
	<SidebarProvider className="font-normal">
		<AdminNav active={section} />
		<SidebarInset>
			<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-4" />
				<span className="text-sm font-medium">
					{sections.find(({ id }) => id === section)?.label}
				</span>
			</header>
			<div className="mx-auto w-full max-w-6xl p-4 sm:p-8 lg:p-10">
				{section === "overview" && <OverviewSection data={data} />}
				{section === "settings" && <SettingsSection settings={data.settings} />}
				{section === "notices" && <NoticesSection notices={data.notices} />}
				{section === "projects" && <ProjectsSection projects={data.projects} />}
				{entrySections.has(section as never) && (
					<EntriesSection
						kind={
							section as
								| "experience"
								| "education"
								| "activity"
								| "award"
								| "certificate"
						}
						entries={data.entries.filter(({ kind }) => kind === section)}
					/>
				)}
				{section === "skills" && <SkillsSection skills={data.skills} />}
				{section === "links" && <LinksSection links={data.links} />}
				{section === "files" && <FilesSection files={data.files} />}
			</div>
		</SidebarInset>
	</SidebarProvider>
);
