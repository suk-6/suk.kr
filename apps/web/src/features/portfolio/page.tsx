import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { assetUrl } from "@/lib/assets";
import { RenewalNotice } from "./notice";

const content = "mx-auto max-w-[1199px]";
const section = `${content} scroll-mt-[72px] py-[72px] min-[761px]:py-24`;
const sectionHeading =
	"mb-10 text-[clamp(2.75rem,7vw,5.25rem)] leading-[.94] font-medium tracking-[-0.055em] min-[761px]:mb-14";
const navLink =
	"text-portfolio-muted transition-colors duration-150 hover:text-white motion-reduce:transition-none";
const entryLink =
	"mt-4 inline-flex items-center gap-1.5 text-base text-portfolio-secondary";
const entryDescription =
	"mt-3 max-w-[700px] text-base leading-[1.6] text-portfolio-description";
const mediaImage =
	"aspect-4/3 bg-portfolio-surface bg-cover bg-center opacity-90 transition-opacity duration-[180ms] group-hover:opacity-100 motion-reduce:transition-none";

export const PortfolioPage = async () => {
	const { settings, projects, entries, notices = [] } = await api.portfolio();
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
		<main className="portfolio min-h-svh px-5 min-[761px]:px-8" id="top">
			<RenewalNotice notices={notices} />
			<header className="sticky top-0 z-20 -mx-5 h-[72px] border-b border-transparent bg-background/95 px-5 backdrop-blur-xl [animation:stickyHeaderBorder_linear_both] [animation-range:0_2px] [animation-timeline:scroll(root_block)] motion-reduce:[animation:none] min-[761px]:-mx-8 min-[761px]:px-8">
				<div className={`${content} flex h-full items-center justify-between`}>
					<a
						href="#top"
						className="portfolio-avatar-link flex items-center gap-2.5 text-base tracking-[-0.02em]"
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
					<nav className="flex items-center gap-4 text-base min-[761px]:gap-7">
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
				className={`${content} flex min-h-[calc(100svh-72px)] flex-col justify-center py-20 min-[761px]:min-h-[min(900px,calc(100svh-72px))]`}
			>
				<p className="portfolio-enter m-0 text-base tracking-[-0.01em] text-portfolio-muted">
					{settings.title}
				</p>
				<h1 className="portfolio-enter portfolio-enter-2 mt-7 mb-0 max-w-[1000px] text-[clamp(4.5rem,18vw,7rem)] leading-[.85] font-medium tracking-[-0.065em] min-[761px]:text-[clamp(6rem,11vw,9rem)]">
					{settings.name}
				</h1>
				<p className="portfolio-enter portfolio-enter-3 mt-9 mb-0 max-w-[620px] text-[clamp(1.2rem,2.4vw,1.6rem)] leading-[1.3] tracking-[-0.025em] text-portfolio-secondary">
					{settings.intro}
				</p>
				<div className="portfolio-enter portfolio-enter-4 mt-9 flex flex-wrap gap-3 text-base font-medium">
					<a
						className="portfolio-primary-cta inline-flex min-h-11 items-center rounded-full bg-white px-[15px] transition-transform active:scale-[.97]"
						href="#work"
					>
						프로젝트 보기
					</a>
				</div>
			</section>

			<section className={`${section} portfolio-scroll-reveal`}>
				<header>
					<h2 className={sectionHeading}>수상</h2>
				</header>
				<div>
					{awards.map((entry) => (
						<article
							className="portfolio-row grid grid-cols-[68px_1fr] items-start gap-3 border-t border-portfolio-line py-5 last:border-b min-[761px]:grid-cols-[150px_1fr] min-[761px]:gap-9"
							key={entry.id}
						>
							<time className="m-0 text-base leading-6 text-portfolio-muted">
								{entry.startDate}
							</time>
							<div>
								<h3 className="m-0 text-base leading-6 font-medium tracking-[-0.01em]">
									{entry.title}
								</h3>
								<p className="mt-1.5 mb-0 text-base leading-6 text-portfolio-muted">
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

			<section className={`${section} portfolio-scroll-reveal`} id="work">
				<header>
					<h2 className={sectionHeading}>프로젝트</h2>
				</header>
				<div className="grid gap-5 min-[761px]:grid-cols-2">
					{projects.map((project, index) => {
						const caseStudyHref = `/work/${project.slug}` as Route;
						return (
							<article
								className="portfolio-card group flex min-h-[430px] flex-col overflow-hidden rounded-[20px] bg-portfolio-surface p-3"
								key={project.id}
							>
								{project.coverUrl ? (
									<Link
										className="relative block overflow-hidden rounded-[15px]"
										href={caseStudyHref}
										aria-label={`${project.name} 케이스 스터디`}
									>
										<div
											className={`${mediaImage} portfolio-media`}
											style={{ backgroundImage: `url(${project.coverUrl})` }}
										/>
										<ArrowUpRight className="absolute right-3 bottom-3 size-10 rounded-full bg-black/75 p-3 backdrop-blur" />
									</Link>
								) : (
									<Link
										className="portfolio-media flex aspect-4/3 items-center justify-center rounded-[15px] bg-portfolio-surface-raised text-base text-portfolio-muted transition-colors hover:text-white"
										href={caseStudyHref}
										aria-label={`${project.name} 케이스 스터디`}
									>
										{String(index + 1).padStart(2, "0")}
									</Link>
								)}
								<div className="flex flex-1 flex-col px-3 pt-7 pb-3">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h3 className="m-0 text-[2rem] leading-[1.05] font-medium tracking-[-0.045em]">
												<Link href={caseStudyHref}>{project.name}</Link>
											</h3>
											{project.organization && (
												<span className="mt-2 block text-base text-portfolio-muted">
													@{project.organization}
												</span>
											)}
										</div>
										<span className="text-base text-portfolio-muted">
											{String(index + 1).padStart(2, "0")}
										</span>
									</div>
									<p className="mt-5 mb-0 text-base leading-[1.45] text-portfolio-muted">
										{project.description}
									</p>
									<div className="mt-auto flex flex-wrap gap-2 pt-8">
										{project.tags.map((tag) => (
											<span
												className="rounded-full bg-portfolio-surface-raised px-3 py-2 text-base leading-5 text-portfolio-secondary"
												key={tag}
											>
												{tag}
											</span>
										))}
									</div>
									<Link
										className="portfolio-accent-link portfolio-arrow-link mt-6 inline-flex items-center gap-1.5 text-base"
										href={caseStudyHref}
									>
										케이스 스터디 <ArrowUpRight className="size-4" />
									</Link>
								</div>
							</article>
						);
					})}
				</div>
			</section>

			<section className={`${section} portfolio-scroll-reveal`} id="about">
				<header>
					<h2 className={sectionHeading}>경력</h2>
				</header>
				<div>
					{experiences.map((entry) => (
						<article
							className="portfolio-row grid grid-cols-1 gap-2.5 border-t border-portfolio-line py-[22px] last:border-b min-[761px]:grid-cols-[150px_220px_1fr] min-[761px]:gap-9 min-[761px]:py-6"
							key={entry.id}
						>
							<time className="m-0 text-base leading-[1.6] text-portfolio-muted">
								{entry.startDate} — {entry.endDate}
							</time>
							<div>
								<h3 className="m-0 mb-1.5 text-base leading-[1.5] font-medium">
									{entry.organization}
								</h3>
								<p className="m-0 text-base leading-[1.6] text-portfolio-secondary">
									{entry.title}
								</p>
							</div>
							<p className="mt-2.5 mb-0 text-base leading-[1.6] text-portfolio-muted min-[761px]:mt-0">
								{entry.description}
							</p>
						</article>
					))}
				</div>
			</section>

			<section className={`${section} portfolio-scroll-reveal`}>
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
								<h3 className="m-0 text-lg font-medium">{title}</h3>
							</header>
							<div>
								{values.map((entry) => (
									<article
										className="portfolio-row grid grid-cols-[80px_1fr] gap-3 border-t border-portfolio-line py-5 last:border-b min-[761px]:grid-cols-[130px_1fr] min-[761px]:gap-7"
										key={entry.id}
									>
										<time className="m-0 text-base leading-[1.5] text-portfolio-muted">
											{entry.startDate}
											{entry.endDate && entry.endDate !== entry.startDate
												? ` — ${entry.endDate}`
												: ""}
										</time>
										<div>
											<strong className="mb-1.5 block text-base leading-[1.5] font-medium">
												{entry.title}
											</strong>
											<p className="m-0 text-base leading-[1.55] text-portfolio-muted">
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
				className={`${content} portfolio-scroll-reveal scroll-mt-[72px] border-t border-portfolio-line pt-[72px] pb-10 min-[761px]:pt-24`}
				id="contact"
			>
				<p className="mt-0 mb-[30px] text-base leading-6 text-portfolio-muted">
					{settings.availableFor}
				</p>
				<a
					className="portfolio-footer-link portfolio-arrow-link flex items-center justify-between gap-4 text-[clamp(2.4rem,7vw,5.25rem)] leading-none font-medium tracking-[-0.06em] transition-colors"
					href={`mailto:${settings.email}`}
				>
					{settings.email} <ArrowUpRight className="size-8" />
				</a>
				<div className="mt-14 flex flex-col gap-[18px] border-t border-portfolio-line pt-5 text-base text-portfolio-muted min-[761px]:mt-[72px] min-[761px]:flex-row min-[761px]:justify-between">
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
