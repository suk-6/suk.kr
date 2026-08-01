import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api/client";

export const PortfolioPage = async () => {
	const { settings, projects, entries, skills } = await api.portfolio();
	const experiences = entries.filter(({ kind }) => kind === "experience");
	const awards = entries.filter(({ kind }) => kind === "award");
	const groups = Map.groupBy(skills, ({ groupName }) => groupName);

	return (
		<main className="portfolio">
			<header className="portfolioNav">
				<a href="#top" className="portfolioMark">
					NW
				</a>
				<nav>
					<a href="#work">Work</a>
					<a href="#about">About</a>
					<a href={`mailto:${settings.email}`}>Contact</a>
				</nav>
			</header>

			<section className="hero" id="top">
				<div className="heroLabel">Seoul · {new Date().getFullYear()}</div>
				<h1>
					{settings.name}
					<span>{settings.title}</span>
				</h1>
				<div className="heroBottom">
					<p>{settings.intro}</p>
					<a href="#work" aria-label="프로젝트로 이동">
						<ArrowDownRight />
					</a>
				</div>
			</section>

			<section className="portfolioSection" id="work">
				<div className="sectionHeading">
					<span className="sectionCounter">01</span>
					<h2>Selected work</h2>
					<p>{projects.length} projects</p>
				</div>
				<div className="projectGrid">
					{projects.map((project, index) => (
						<article className="projectCard" key={project.id}>
							<a
								href={project.projectUrl || project.repoUrl || "#work"}
								target={
									project.projectUrl || project.repoUrl ? "_blank" : undefined
								}
							>
								<div
									className="projectImage"
									style={{ backgroundImage: `url(${project.coverUrl})` }}
								>
									<span className="projectIndex">0{index + 1}</span>
								</div>
								<div className="projectMeta">
									<div>
										<h3>{project.name}</h3>
										<p>{project.subtitle}</p>
									</div>
									<ArrowUpRight />
								</div>
							</a>
							<p className="projectDescription">{project.description}</p>
							<div className="projectTags">
								{project.tags.map((tag) => (
									<span className="projectTag" key={tag}>
										{tag}
									</span>
								))}
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="portfolioSection darkSection" id="about">
				<div className="sectionHeading">
					<span className="sectionCounter">02</span>
					<h2>Experience</h2>
					<p>{settings.location}</p>
				</div>
				<div className="experienceList">
					{experiences.map((entry) => (
						<article key={entry.id}>
							<time>
								{entry.startDate} — {entry.endDate}
							</time>
							<div>
								<h3>{entry.organization}</h3>
								<p>{entry.title}</p>
							</div>
							<p>{entry.description}</p>
						</article>
					))}
				</div>
			</section>

			<section className="portfolioSection">
				<div className="sectionHeading">
					<span className="sectionCounter">03</span>
					<h2>Recognition</h2>
					<p>Selected awards</p>
				</div>
				<div className="awardList">
					{awards.slice(0, 12).map((entry) => (
						<article key={entry.id}>
							<time>{entry.startDate}</time>
							<h3>{entry.title}</h3>
							<p>{entry.organization}</p>
						</article>
					))}
				</div>
			</section>

			<section className="portfolioSection skillsSection">
				<div className="sectionHeading">
					<span className="sectionCounter">04</span>
					<h2>Toolkit</h2>
					<p>Built through practice</p>
				</div>
				<div className="skillGroups">
					{[...groups].map(([group, values]) => (
						<article key={group}>
							<h3>{group}</h3>
							<p>{values.map(({ name }) => name).join(" · ")}</p>
						</article>
					))}
				</div>
			</section>

			<footer className="portfolioFooter">
				<p>Have a difficult problem?</p>
				<a href={`mailto:${settings.email}`}>
					Let’s talk <ArrowUpRight />
				</a>
				<div>
					<span>
						© {new Date().getFullYear()} {settings.name}
					</span>
					<nav>
						<a href={settings.githubUrl}>GitHub</a>
						<a href={settings.linkedinUrl}>LinkedIn</a>
						<a href={settings.resumeUrl}>Résumé</a>
					</nav>
				</div>
			</footer>
		</main>
	);
};
