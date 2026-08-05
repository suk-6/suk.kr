"use client";

import type { Entry } from "@suk/contracts";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

const button =
	"border-b pb-1 text-base transition-colors duration-150 motion-reduce:transition-none";

export const Awards = ({ entries }: { entries: Entry[] }) => {
	const [showAll, setShowAll] = useState(false);
	const visibleEntries = showAll
		? entries
		: entries.filter(({ summaryHidden }) => !summaryHidden);

	return (
		<>
			<header className="mb-10 flex items-end justify-between gap-6 min-[761px]:mb-14">
				<h2 className="m-0 text-[clamp(2.75rem,7vw,5.25rem)] leading-[.94] font-medium tracking-[-0.055em]">
					수상
				</h2>
				<div
					className="mb-1 flex shrink-0 gap-5"
					role="group"
					aria-label="수상 표시 범위"
				>
					<button
						className={`${button} ${showAll ? "border-transparent text-portfolio-muted hover:text-white" : "border-white text-white"}`}
						type="button"
						aria-pressed={!showAll}
						onClick={() => setShowAll(false)}
					>
						간략히 표시
					</button>
					<button
						className={`${button} ${showAll ? "border-white text-white" : "border-transparent text-portfolio-muted hover:text-white"}`}
						type="button"
						aria-pressed={showAll}
						onClick={() => setShowAll(true)}
					>
						모두 표시
					</button>
				</div>
			</header>
			<div aria-live="polite">
				{visibleEntries.map((entry) => (
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
								<p className="mt-3 max-w-[700px] text-base leading-[1.6] text-portfolio-description">
									{entry.description}
								</p>
							)}
							{entry.url && (
								<a
									className="mt-4 inline-flex items-center gap-1.5 text-base text-portfolio-secondary"
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
		</>
	);
};
