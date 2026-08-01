import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

const content = "mx-auto max-w-[1040px]";
const section = `${content} scroll-mt-[60px] border-t border-portfolio-line pt-[72px] pb-[84px] min-[761px]:pt-24 min-[761px]:pb-28`;
const sectionHeading =
	"mb-11 text-[clamp(2rem,4vw,3rem)] leading-none font-[450] tracking-[-0.05em] min-[761px]:mb-16";
const navLink =
	"text-portfolio-muted transition-colors duration-150 hover:text-portfolio-text motion-reduce:transition-none";
const entryLink =
	"mt-[13px] inline-flex items-center gap-[5px] text-[11px] text-portfolio-secondary";
const entryDescription =
	"mt-[13px] max-w-[700px] text-xs leading-[1.7] text-portfolio-description";
const mediaImage =
	"aspect-4/3 bg-portfolio-surface bg-cover bg-center opacity-[.86] grayscale-[.25] transition-[filter,opacity] duration-[180ms] group-hover:opacity-100 group-hover:grayscale-0 motion-reduce:transition-none";

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
		<main className="min-h-svh px-5 min-[761px]:px-8" id="top">
			<header className="sticky top-0 z-20 -mx-5 h-[60px] border-b border-transparent bg-background px-5 [animation:stickyHeaderBorder_linear_both] [animation-range:0_2px] [animation-timeline:scroll(root_block)] motion-reduce:[animation:none] min-[761px]:-mx-8 min-[761px]:px-8">
				<div className={`${content} flex h-full items-center justify-between`}>
					<a
						href="#top"
						className="flex items-center gap-2.5 text-sm tracking-[-0.02em]"
					>
						<Image
							className="rounded-full object-cover"
							src={assetUrl("profile.png")}
							alt=""
							width={30}
							height={30}
							priority
						/>
						<span>@woosuknam</span>
					</a>
					<nav className="flex gap-4 text-[13px] min-[761px]:gap-7">
						<a className={navLink} href="#work">
							프로젝트
						</a>
						<a className={navLink} href="#about">
							소개
						</a>
						<a className={navLink} href="#contact">
							연락
						</a>
					</nav>
				</div>
			</header>

			<section
				className={`${content} flex min-h-[calc(100svh-60px)] flex-col justify-end pt-[72px] pb-16 min-[761px]:min-h-[min(760px,calc(100svh-60px))] min-[761px]:pt-[100px] min-[761px]:pb-28`}
			>
				<p className="m-0 text-xs tracking-[0.03em] text-portfolio-muted">
					{settings.title}
				</p>
				<h1 className="mt-6 mb-0 text-[clamp(4rem,22vw,6rem)] leading-[0.95] font-[450] tracking-[-0.075em] min-[761px]:mt-7 min-[761px]:text-[clamp(4.25rem,9vw,7rem)]">
					{settings.name}
				</h1>
			</section>

			<section className={section}>
				<header>
					<h2 className={sectionHeading}>수상</h2>
				</header>
				<div>
					{awards.map((entry) => (
						<article
							className="grid grid-cols-[68px_1fr] items-start gap-3 border-t border-portfolio-line py-5 last:border-b min-[761px]:grid-cols-[150px_1fr] min-[761px]:gap-9"
							key={entry.id}
						>
							<time className="m-0 text-xs text-portfolio-muted">
								{entry.startDate}
							</time>
							<div>
								<h3 className="m-0 text-sm leading-6 font-normal">
									{entry.title}
								</h3>
								<p className="mt-[5px] mb-0 text-xs text-portfolio-muted">
									{entry.organization}
								</p>
								{entry.description && (
									<p className={entryDescription}>{entry.description}</p>
								)}
								{entry.url && (
									<a
										className={entryLink}
										href={entry.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										관련 자료 <ArrowUpRight className="size-3" />
									</a>
								)}
							</div>
						</article>
					))}
				</div>
			</section>

			<section className={section} id="work">
				<header>
					<h2 className={sectionHeading}>프로젝트</h2>
				</header>
				<div>
					{projects.map((project, index) => {
						const href = project.projectUrl || project.repoUrl;
						return (
							<article
								className={cn(
									"grid gap-8 border-t border-portfolio-line py-9 first:border-t-0 first:pt-0 min-[761px]:grid-cols-[minmax(0,1fr)_340px] min-[761px]:gap-[72px] min-[761px]:py-11 min-[761px]:pb-14",
									!project.coverUrl &&
										"min-[761px]:grid-cols-[minmax(0,760px)]",
								)}
								key={project.id}
							>
								<div className="grid content-start grid-cols-[32px_1fr] min-[761px]:grid-cols-[42px_minmax(0,1fr)]">
									<span className="col-start-1 pt-[5px] text-[11px] text-portfolio-muted">
										{String(index + 1).padStart(2, "0")}
									</span>
									<div className="col-start-2">
										<h3 className="m-0 text-2xl font-[450] tracking-[-0.035em]">
											{project.name}
										</h3>
										{project.organization && (
											<span className="mt-1.5 mb-2.5 block text-xs text-portfolio-muted">
												@{project.organization}
											</span>
										)}
										<p className="m-0 text-[13px] leading-[1.65] text-portfolio-muted">
											{project.subtitle}
										</p>
									</div>
									<p className="col-start-2 mt-8 mb-0 text-sm leading-[1.65] text-portfolio-muted">
										{project.description}
									</p>
									{project.highlights.length > 0 && (
										<ul className="col-start-2 mt-6 grid list-none gap-[9px] p-0 text-[13px]">
											{project.highlights.map((highlight) => (
												<li
													className="leading-[1.5] text-portfolio-highlight before:text-portfolio-muted before:content-['—_']"
													key={highlight}
												>
													{highlight}
												</li>
											))}
										</ul>
									)}
									<div className="col-start-2 mt-[30px] flex flex-wrap gap-x-4 gap-y-[7px]">
										{project.tags.map((tag) => (
											<span
												className="text-[11px] text-portfolio-muted"
												key={tag}
											>
												{tag}
											</span>
										))}
									</div>
									{href && !project.coverUrl && (
										<a
											className="col-start-2 mt-[22px] inline-flex items-center gap-[5px] text-[11px] text-portfolio-secondary"
											href={href}
											target="_blank"
											rel="noopener noreferrer"
										>
											프로젝트 보기 <ArrowUpRight className="size-3" />
										</a>
									)}
								</div>
								{project.coverUrl && href ? (
									<a
										className="group relative block self-start max-[760px]:row-start-1"
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={`${project.name} 열기`}
									>
										<div
											className={mediaImage}
											style={{ backgroundImage: `url(${project.coverUrl})` }}
										/>
										<ArrowUpRight className="absolute right-0 bottom-0 size-9 bg-background p-[9px]" />
									</a>
								) : project.coverUrl ? (
									<div
										className="relative block self-start max-[760px]:row-start-1"
										aria-hidden="true"
									>
										<div
											className={mediaImage}
											style={{ backgroundImage: `url(${project.coverUrl})` }}
										/>
									</div>
								) : null}
							</article>
						);
					})}
				</div>
			</section>

			<section className={section} id="about">
				<header>
					<h2 className={sectionHeading}>경력</h2>
				</header>
				<div>
					{experiences.map((entry) => (
						<article
							className="grid grid-cols-1 gap-2.5 border-t border-portfolio-line py-[22px] last:border-b min-[761px]:grid-cols-[150px_220px_1fr] min-[761px]:gap-9 min-[761px]:py-6"
							key={entry.id}
						>
							<time className="m-0 text-[13px] leading-[1.65] text-portfolio-muted">
								{entry.startDate} — {entry.endDate}
							</time>
							<div>
								<h3 className="m-0 mb-[5px] text-sm leading-[1.5] font-[450]">
									{entry.organization}
								</h3>
								<p className="m-0 text-[13px] leading-[1.65] text-portfolio-secondary">
									{entry.title}
								</p>
							</div>
							<p className="mt-2.5 mb-0 text-[13px] leading-[1.65] text-portfolio-muted min-[761px]:mt-0">
								{entry.description}
							</p>
						</article>
					))}
				</div>
			</section>

			<section className={section}>
				<header>
					<h2 className={sectionHeading}>활동과 배움</h2>
				</header>
				<div className="grid gap-14 min-[761px]:gap-[72px]">
					{beyond.map(([title, values]) => (
						<section
							className="grid grid-cols-1 gap-[22px] min-[761px]:grid-cols-[150px_1fr] min-[761px]:gap-9"
							key={title}
						>
							<header>
								<h3 className="m-0 text-lg font-[450]">{title}</h3>
							</header>
							<div>
								{values.map((entry) => (
									<article
										className="grid grid-cols-[80px_1fr] gap-3 border-t border-portfolio-line py-5 last:border-b min-[761px]:grid-cols-[130px_1fr] min-[761px]:gap-7"
										key={entry.id}
									>
										<time className="m-0 text-[11px] leading-[1.5] text-portfolio-muted">
											{entry.startDate}
											{entry.endDate && entry.endDate !== entry.startDate
												? ` — ${entry.endDate}`
												: ""}
										</time>
										<div>
											<strong className="mb-[5px] block text-[13px] leading-[1.5] font-[450]">
												{entry.title}
											</strong>
											<p className="m-0 text-[11px] leading-[1.5] text-portfolio-muted">
												{entry.organization}
											</p>
											{entry.description && (
												<p className={entryDescription}>{entry.description}</p>
											)}
											{entry.url && (
												<a
													className={entryLink}
													href={entry.url}
													target="_blank"
													rel="noopener noreferrer"
												>
													관련 자료 <ArrowUpRight className="size-3" />
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

			<footer
				className={`${content} scroll-mt-[60px] border-t border-portfolio-line pt-[72px] pb-10 min-[761px]:pt-24`}
				id="contact"
			>
				<p className="mt-0 mb-[30px] text-xs text-portfolio-muted">
					{settings.availableFor}
				</p>
				<a
					className="flex items-center justify-between text-[clamp(2rem,5vw,4rem)] font-normal tracking-[-0.055em]"
					href={`mailto:${settings.email}`}
				>
					{settings.email} <ArrowUpRight className="size-8" />
				</a>
				<div className="mt-14 flex flex-col gap-[18px] border-t border-portfolio-line pt-[18px] text-[11px] min-[761px]:mt-[72px] min-[761px]:flex-row min-[761px]:justify-between">
					<span>
						© {new Date().getFullYear()} {settings.name}
					</span>
					<nav className="flex gap-[22px]">
						{profileLinks.map(([label, url]) => (
							<a className={navLink} href={url} key={label}>
								{label}
							</a>
						))}
					</nav>
				</div>
			</footer>
		</main>
	);
};
