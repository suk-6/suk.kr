import { entrySections, type Section } from "./config";
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
	<main className="min-h-svh bg-background text-foreground">
		<AdminNav active={section} />
		<div className="mx-auto max-w-7xl p-5 sm:p-8 lg:ml-60 lg:p-10">
			{section === "overview" && <OverviewSection data={data} />}
			{section === "settings" && <SettingsSection settings={data.settings} />}
			{section === "notices" && <NoticesSection notices={data.notices} />}
			{section === "projects" && <ProjectsSection projects={data.projects} />}
			{entrySections.has(section as never) && (
				<EntriesSection
					kind={
						section as
							"experience" | "education" | "activity" | "award" | "certificate"
					}
					entries={data.entries.filter(({ kind }) => kind === section)}
				/>
			)}
			{section === "skills" && <SkillsSection skills={data.skills} />}
			{section === "links" && <LinksSection links={data.links} />}
			{section === "files" && <FilesSection files={data.files} />}
		</div>
	</main>
);
