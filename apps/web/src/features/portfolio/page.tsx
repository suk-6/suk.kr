import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { assetUrl } from "@/lib/assets";

export const PortfolioPage = async () => {
	const { settings, projects, entries } = await api.portfolio();
	const experiences = entries.filter(({ kind }) => kind === "experience");
	const awards = entries.filter(({ kind }) => kind === "award");
	const beyond = [
		["학력", entries.filter(({ kind }) => kind === "education")],
		["활동", entries.filter(({ kind }) => kind === "activity")],
		["자격", entries.filter(({ kind }) => kind === "certificate")],
	] as const;
	const profileLinks = [
		["GitHub", settings.githubUrl],
		["LinkedIn", settings.linkedinUrl],
	].filter(([, url]) => url);

	return (
		<main className="portfolio" id="top">
			<header className="portfolioNav">
				<div className="portfolioNavInner">
					<a href="#top" className="portfolioMark">
						<Image
							src={assetUrl("profile.png")}
							alt=""
							width={30}
							height={30}
							priority
						/>
						<span>@woosuknam</span>
					</a>
					<nav>
						<a href="#work">프로젝트</a>
						<a href="#about">소개</a>
						<a href={`mailto:${settings.email}`}>연락</a>
					</nav>
				</div>
			</header>

			<section className="hero">
				<p className="heroLabel">{settings.title}</p>
				<h1>{settings.name}</h1>
			</section>

			<section className="portfolioSection">
				<header className="sectionHeading">
					<h2>수상</h2>
				</header>
				<div className="awardList">
					{awards.map((entry) => (
						<article key={entry.id}>
							<time>{entry.startDate}</time>
							<div className="awardContent">
								<h3>{entry.title}</h3>
								<p>{entry.organization}</p>
								{entry.description && (
									<p className="entryDescription">{entry.description}</p>
								)}
								{entry.url && (
									<a
										className="entryLink"
										href={entry.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										관련 자료 <ArrowUpRight />
									</a>
								)}
							</div>
						</article>
					))}
				</div>
			</section>

			<section className="portfolioSection" id="work">
				<header className="sectionHeading">
					<h2>프로젝트</h2>
				</header>
				<div className="projectList">
					{projects.map((project, index) => {
						const href = project.projectUrl || project.repoUrl;
						return (
							<article
								className={`projectCard${project.coverUrl ? "" : " projectCardText"}`}
								key={project.id}
							>
								<div className="projectCopy">
									<span className="projectIndex">
										{String(index + 1).padStart(2, "0")}
									</span>
									<div className="projectMeta">
										<h3>{project.name}</h3>
										{project.organization && (
											<span>@{project.organization}</span>
										)}
										<p>{project.subtitle}</p>
									</div>
									<p className="projectDescription">{project.description}</p>
									{project.highlights.length > 0 && (
										<ul className="projectHighlights">
											{project.highlights.map((highlight) => (
												<li key={highlight}>{highlight}</li>
											))}
										</ul>
									)}
									<div className="projectTags">
										{project.tags.map((tag) => (
											<span key={tag}>{tag}</span>
										))}
									</div>
									{href && !project.coverUrl && (
										<a
											className="projectLink"
											href={href}
											target="_blank"
											rel="noopener noreferrer"
										>
											프로젝트 보기 <ArrowUpRight />
										</a>
									)}
								</div>
								{project.coverUrl && href ? (
									<a
										className="projectMedia"
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`${project.name} 열기`}
									>
										<div
											style={{ backgroundImage: `url(${project.coverUrl})` }}
										/>
										<ArrowUpRight />
									</a>
								) : project.coverUrl ? (
									<div className="projectMedia" aria-hidden="true">
										<div
											style={{ backgroundImage: `url(${project.coverUrl})` }}
										/>
									</div>
								) : null}
							</article>
						);
					})}
				</div>
			</section>

			<section className="portfolioSection" id="about">
				<header className="sectionHeading">
					<h2>경력</h2>
				</header>
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
				<header className="sectionHeading">
					<h2>활동과 배움</h2>
				</header>
				<div className="archiveGroups">
					{beyond.map(([title, values]) => (
						<section className="archiveGroup" key={title}>
							<header>
								<h3>{title}</h3>
							</header>
							<div className="archiveList">
								{values.map((entry) => (
									<article key={entry.id}>
										<time>
											{entry.startDate}
											{entry.endDate && entry.endDate !== entry.startDate
												? ` — ${entry.endDate}`
												: ""}
										</time>
										<div>
											<strong>{entry.title}</strong>
											<p>{entry.organization}</p>
											{entry.description && (
												<p className="entryDescription">{entry.description}</p>
											)}
											{entry.url && (
												<a
													className="entryLink"
													href={entry.url}
													target="_blank"
													rel="noopener noreferrer"
												>
													관련 자료 <ArrowUpRight />
												</a>
											)}
										</div>
									</article>
								))}
							</div>
						</section>
					))}
				</div>
			</section>

			<footer className="portfolioFooter">
				<p>{settings.availableFor}</p>
				<a href={`mailto:${settings.email}`}>
					{settings.email} <ArrowUpRight />
				</a>
				<div>
					<span>
						© {new Date().getFullYear()} {settings.name}
					</span>
					<nav>
						{profileLinks.map(([label, url]) => (
							<a href={url} key={label}>
								{label}
							</a>
						))}
					</nav>
				</div>
			</footer>
		</main>
	);
};
