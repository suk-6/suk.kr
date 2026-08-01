import { entrySections, type Section } from "./config";
import type { AdminData } from "./data";
import { AdminNav } from "./nav";
import { EntriesSection } from "./sections/entries";
import { FilesSection } from "./sections/files";
import { LinksSection } from "./sections/links";
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
	<main className="min-h-svh bg-zinc-50 text-zinc-950">
		<AdminNav active={section} />
		<div className="p-5 sm:p-8 lg:ml-64 lg:p-10">
			{section === "overview" && <OverviewSection data={data} />}
			{section === "settings" && <SettingsSection settings={data.settings} />}
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
	</main>
);
