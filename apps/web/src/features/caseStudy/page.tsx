import type { Project } from "@suk/contracts";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

const content = "mx-auto max-w-[1199px]";

export const CaseStudyPage = ({
	project,
	nextProject,
}: {
	project: Project;
	nextProject?: Project;
}) => {
	const externalUrl = project.projectUrl || project.repoUrl;

	return (
		<main className="portfolio min-h-svh px-5 min-[761px]:px-8">
			<header className="sticky top-0 z-20 -mx-5 h-[72px] border-b border-transparent bg-background/95 px-5 backdrop-blur-xl min-[761px]:-mx-8 min-[761px]:px-8">
				<div className={`${content} flex h-full items-center justify-between`}>
					<Link
						className="flex min-h-11 items-center gap-2 text-base text-portfolio-muted transition-colors hover:text-white"
						href="/#work"
					>
						<ArrowLeft className="size-4" /> 프로젝트
					</Link>
					<span className="text-base text-portfolio-muted">Case study</span>
				</div>
			</header>

			<article>
				<header
					className={`${content} flex min-h-[min(780px,calc(100svh-72px))] flex-col justify-end py-20 min-[761px]:py-28`}
				>
					<div className="portfolio-enter flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-portfolio-muted">
						<span>{project.organization || "Independent"}</span>
						<span aria-hidden="true">·</span>
						<span>{project.tags.join(" · ")}</span>
					</div>
					<h1 className="portfolio-enter portfolio-enter-2 mt-7 mb-0 max-w-[1050px] text-[clamp(4rem,16vw,7rem)] leading-[.88] font-medium tracking-[-0.065em] min-[761px]:text-[clamp(6rem,10vw,8.5rem)]">
						{project.name}
					</h1>
					<p className="portfolio-enter portfolio-enter-3 mt-9 mb-0 max-w-[760px] text-[clamp(1.25rem,2.8vw,2rem)] leading-[1.25] tracking-[-0.03em] text-portfolio-secondary">
						{project.subtitle}
					</p>
					{externalUrl && (
						<a
							className="portfolio-primary-cta portfolio-arrow-link portfolio-enter portfolio-enter-4 mt-10 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-white px-[15px] text-base font-medium transition-transform active:scale-[.97]"
							href={externalUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							프로젝트 열기 <ArrowUpRight className="size-4" />
						</a>
					)}
				</header>

				<section
					className={`${content} portfolio-scroll-reveal pb-20 min-[761px]:pb-28`}
				>
					<div className="portfolio-card overflow-hidden rounded-[20px] bg-portfolio-surface p-3">
						<div
							className="portfolio-media flex aspect-[16/9] items-end rounded-[15px] bg-portfolio-surface-raised bg-cover bg-center p-6 min-[761px]:p-10"
							style={
								project.coverUrl
									? { backgroundImage: `url(${project.coverUrl})` }
									: undefined
							}
						>
							{!project.coverUrl && (
								<span className="text-[clamp(2.5rem,8vw,6rem)] leading-none font-medium tracking-[-0.055em] text-portfolio-line">
									{project.name}
								</span>
							)}
						</div>
					</div>
				</section>

				<section
					className={`${content} portfolio-scroll-reveal grid gap-12 border-t border-portfolio-line py-20 min-[761px]:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] min-[761px]:gap-24 min-[761px]:py-28`}
				>
					<div>
						<p className="m-0 text-base text-portfolio-muted">프로젝트 개요</p>
						<p className="mt-6 mb-0 max-w-[760px] text-xl leading-[1.5] tracking-[-0.02em] text-portfolio-description min-[761px]:text-2xl">
							{project.description}
						</p>
					</div>
					<aside className="grid content-start gap-8">
						<div>
							<p className="m-0 text-base text-portfolio-muted">함께한 곳</p>
							<p className="mt-2 mb-0 text-base">
								{project.organization || "Independent"}
							</p>
						</div>
						<div>
							<p className="m-0 text-base text-portfolio-muted">기술</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{project.tags.map((tag) => (
									<span
										className="rounded-full bg-portfolio-surface px-3 py-2 text-base text-portfolio-secondary"
										key={tag}
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					</aside>
				</section>

				{project.caseStudy.length > 0 && (
					<section
						className={`${content} portfolio-scroll-reveal border-t border-portfolio-line py-20 min-[761px]:py-28`}
					>
						<div className="grid gap-16 min-[761px]:gap-24">
							{project.caseStudy.map((section, index) => (
								<div
									className="grid gap-6 min-[761px]:grid-cols-[220px_minmax(0,760px)] min-[761px]:gap-16"
									key={`${section.title}-${index}`}
								>
									<div>
										<span className="text-base text-portfolio-muted">
											{String(index + 1).padStart(2, "0")}
										</span>
										<h2 className="mt-3 mb-0 text-2xl leading-tight font-medium tracking-[-0.035em]">
											{section.title}
										</h2>
									</div>
									<div>
										{section.imageUrl && (
											<div
												className="mb-8 aspect-video rounded-[20px] bg-portfolio-surface bg-cover bg-center"
												style={{ backgroundImage: `url(${section.imageUrl})` }}
												role="img"
												aria-label={`${section.title} 이미지`}
											/>
										)}
										<p className="m-0 whitespace-pre-line text-base leading-[1.7] text-portfolio-description min-[761px]:text-lg">
											{section.body}
										</p>
										{section.code && (
											<div className="mt-8 overflow-hidden rounded-[20px] border border-white/10 bg-[#0d0d0d]">
												{section.codeLanguage && (
													<div className="border-b border-white/10 px-5 py-3 font-mono text-base text-zinc-500">
														{section.codeLanguage}
													</div>
												)}
												<pre className="m-0 overflow-x-auto p-5 text-base leading-6 text-zinc-200">
													<code>{section.code}</code>
												</pre>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</section>
				)}

				{project.highlights.length > 0 && (
					<section
						className={`${content} portfolio-scroll-reveal border-t border-portfolio-line py-20 min-[761px]:py-28`}
					>
						<p className="m-0 text-base text-portfolio-muted">핵심 기여</p>
						<ol className="mt-10 grid list-none gap-4 p-0 min-[761px]:grid-cols-2">
							{project.highlights.map((highlight, index) => (
								<li
									className="portfolio-card flex min-h-[220px] flex-col justify-between rounded-[20px] bg-portfolio-surface p-6 min-[761px]:p-8"
									key={highlight}
								>
									<span className="text-base text-portfolio-muted">
										{String(index + 1).padStart(2, "0")}
									</span>
									<p className="mt-10 mb-0 text-lg leading-[1.45] tracking-[-0.02em] min-[761px]:text-xl">
										{highlight}
									</p>
								</li>
							))}
						</ol>
					</section>
				)}
			</article>

			<footer
				className={`${content} portfolio-scroll-reveal border-t border-portfolio-line py-20 min-[761px]:py-28`}
			>
				{nextProject ? (
					<Link
						className="portfolio-arrow-link group block"
						href={`/work/${nextProject.slug}` as Route}
					>
						<span className="text-base text-portfolio-muted">
							다음 프로젝트
						</span>
						<span className="mt-5 flex items-center justify-between gap-4 text-[clamp(2.75rem,8vw,6rem)] leading-none font-medium tracking-[-0.055em] transition-colors group-hover:text-portfolio-link">
							{nextProject.name}{" "}
							<ArrowUpRight className="size-8 min-[761px]:size-12" />
						</span>
					</Link>
				) : (
					<Link
						className="text-base text-portfolio-muted hover:text-white"
						href="/#work"
					>
						모든 프로젝트 보기
					</Link>
				)}
			</footer>
		</main>
	);
};
