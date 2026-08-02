"use client";

import type { Project } from "@suk/contracts";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ExternalLink,
	Plus,
	Trash2,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveCaseStudy } from "./actions";

type Section = Project["caseStudy"][number] & { id: string };

export const CaseStudyEditor = ({
	project,
	saved,
}: {
	project: Project;
	saved: boolean;
}) => {
	const [sections, setSections] = useState<Section[]>(() =>
		project.caseStudy.map((section, index) => ({
			...section,
			id: String(index),
		})),
	);
	const move = (index: number, direction: -1 | 1) => {
		setSections((current) => {
			const target = index + direction;
			if (target < 0 || target >= current.length) return current;
			const next = [...current];
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	};

	return (
		<main className="min-h-svh bg-background text-foreground">
			<header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<div className="flex min-w-0 items-center gap-3">
						<Button asChild variant="ghost" size="icon-sm">
							<Link
								href="/admin?section=projects"
								aria-label="프로젝트 관리로 돌아가기"
							>
								<ArrowLeft />
							</Link>
						</Button>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{project.name}</p>
							<p className="text-xs text-muted-foreground">
								{saved ? "저장됨" : "케이스 스터디 편집"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button asChild variant="ghost" size="sm">
							<Link href={`/work/${project.slug}` as Route} target="_blank">
								미리보기 <ExternalLink />
							</Link>
						</Button>
						<Button type="submit" form="case-study-form" size="sm">
							저장
						</Button>
					</div>
				</div>
			</header>

			<form
				id="case-study-form"
				action={saveCaseStudy}
				className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24"
			>
				<input type="hidden" name="id" value={project.id} />
				<p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
					Case study
				</p>
				<h1 className="mt-4 text-4xl leading-tight font-bold tracking-[-0.04em] sm:text-5xl">
					{project.name}
				</h1>
				<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
					제목과 본문으로 문서를 구성하세요. 블록 순서는 공개 케이스 스터디에
					그대로 반영됩니다.
				</p>

				<div className="mt-16 grid gap-3">
					{sections.map((section, index) => (
						<section
							className="group relative -mx-3 rounded-lg px-3 py-5 transition-colors hover:bg-muted/30"
							key={section.id}
						>
							<div className="absolute top-5 right-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									disabled={index === 0}
									aria-label={`섹션 ${index + 1} 위로 이동`}
									onClick={() => move(index, -1)}
								>
									<ArrowUp />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									disabled={index === sections.length - 1}
									aria-label={`섹션 ${index + 1} 아래로 이동`}
									onClick={() => move(index, 1)}
								>
									<ArrowDown />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label={`섹션 ${index + 1} 삭제`}
									onClick={() =>
										setSections((current) =>
											current.filter(({ id }) => id !== section.id),
										)
									}
								>
									<Trash2 />
								</Button>
							</div>
							<span className="mb-3 block text-xs text-muted-foreground">
								{String(index + 1).padStart(2, "0")}
							</span>
							<input
								name="caseStudyTitle"
								value={section.title}
								placeholder="제목 없음"
								className="block w-full border-0 bg-transparent pr-24 text-2xl font-semibold tracking-[-0.025em] outline-none placeholder:text-muted-foreground/45 sm:text-3xl"
								onChange={(event) =>
									setSections((current) =>
										current.map((value) =>
											value.id === section.id
												? { ...value, title: event.target.value }
												: value,
										),
									)
								}
								required
							/>
							<textarea
								name="caseStudyBody"
								value={section.body}
								placeholder="내용을 입력하세요..."
								className="mt-4 min-h-32 w-full resize-none border-0 bg-transparent text-base leading-7 outline-none [field-sizing:content] placeholder:text-muted-foreground/45"
								onChange={(event) =>
									setSections((current) =>
										current.map((value) =>
											value.id === section.id
												? { ...value, body: event.target.value }
												: value,
										),
									)
								}
								required
							/>
						</section>
					))}
				</div>

				<Button
					type="button"
					variant="ghost"
					className="mt-4 text-muted-foreground"
					disabled={sections.length >= 12}
					onClick={() =>
						setSections((current) => [
							...current,
							{ id: crypto.randomUUID(), title: "", body: "" },
						])
					}
				>
					<Plus /> 새 섹션
				</Button>
			</form>
		</main>
	);
};
