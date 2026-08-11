"use client";

import type { Project } from "@suk/contracts";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Code2,
	ExternalLink,
	GripVertical,
	ImagePlus,
	Plus,
	Trash2,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { type DragEvent, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { saveCaseStudy } from "./actions";

type Section = Project["caseStudy"][number] & {
	id: string;
	showCode: boolean;
};

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
			showCode: Boolean(section.code || section.codeLanguage),
		})),
	);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [dragOverId, setDragOverId] = useState<string | null>(null);
	const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});
	const update = (id: string, value: Partial<Section>) =>
		setSections((current) =>
			current.map((section) =>
				section.id === id ? { ...section, ...value } : section,
			),
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
	const dropSection = (targetId: string) => {
		if (!draggedId || draggedId === targetId) return;
		setSections((current) => {
			const from = current.findIndex(({ id }) => id === draggedId);
			const to = current.findIndex(({ id }) => id === targetId);
			if (from === -1 || to === -1) return current;
			const next = [...current];
			const [moved] = next.splice(from, 1);
			next.splice(to, 0, moved);
			return next;
		});
		setDraggedId(null);
		setDragOverId(null);
	};
	const uploadImage = async (id: string, file?: File) => {
		if (!file) return;
		setUploadStatus((current) => ({ ...current, [id]: "업로드 중…" }));
		try {
			const signed = await fetch("/api/case-study/images/sign", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fileName: file.name,
					contentType: file.type,
					size: file.size,
				}),
			});
			if (!signed.ok)
				throw new Error(((await signed.json()) as { error: string }).error);
			const { uploadUrl, publicUrl } = (await signed.json()) as {
				uploadUrl: string;
				publicUrl: string;
			};
			const uploaded = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!uploaded.ok) throw new Error("이미지 업로드에 실패했습니다.");
			update(id, { imageUrl: publicUrl });
			setUploadStatus((current) => ({ ...current, [id]: "업로드 완료" }));
		} catch (error) {
			setUploadStatus((current) => ({
				...current,
				[id]: error instanceof Error ? error.message : "업로드에 실패했습니다.",
			}));
		}
	};
	const acceptImageDrop = (event: DragEvent, id: string) => {
		const file = event.dataTransfer.files[0];
		if (!file) return;
		event.preventDefault();
		event.stopPropagation();
		void uploadImage(id, file);
	};

	return (
		<main className="min-h-svh bg-background text-foreground">
			<header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur-xl">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<div className="flex min-w-0 items-center gap-3">
						<Link
							className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
							href="/admin?section=projects"
							aria-label="프로젝트 관리로 돌아가기"
						>
							<ArrowLeft />
						</Link>
						<div className="min-w-0">
							<p className="truncate text-base font-medium">{project.name}</p>
							<p className="text-base text-muted-foreground">
								{saved ? "저장됨" : "케이스 스터디 편집"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Link
							className={buttonVariants({ variant: "ghost", size: "sm" })}
							href={`/work/${project.slug}` as Route}
							target="_blank"
						>
							미리보기 <ExternalLink />
						</Link>
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
				<p className="text-base font-medium tracking-[0.12em] text-muted-foreground uppercase">
					Case study
				</p>
				<h1 className="mt-4 text-4xl leading-tight font-bold tracking-[-0.04em] sm:text-5xl">
					{project.name}
				</h1>
				<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
					블록을 드래그해 순서를 바꾸고 이미지를 끌어다 놓을 수 있습니다. 저장한
					순서는 공개 페이지에 그대로 반영됩니다.
				</p>

				<div className="mt-16 grid gap-3">
					{sections.map((section, index) => (
						<section
							className={`group relative -mx-3 rounded-lg border border-transparent px-3 py-5 transition-colors hover:bg-muted/30 ${dragOverId === section.id ? "border-ring bg-muted/30" : ""}`}
							key={section.id}
							onDragEnter={() => {
								if (draggedId) setDragOverId(section.id);
							}}
							onDragOver={(event) => {
								if (draggedId) event.preventDefault();
							}}
							onDrop={(event) => {
								event.preventDefault();
								dropSection(section.id);
							}}
						>
							<div className="absolute top-5 right-3 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
								<button
									type="button"
									draggable
									className="flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
									aria-label={`섹션 ${index + 1} 드래그하여 이동`}
									onDragStart={(event) => {
										event.dataTransfer.effectAllowed = "move";
										setDraggedId(section.id);
									}}
									onDragEnd={() => {
										setDraggedId(null);
										setDragOverId(null);
									}}
								>
									<GripVertical className="size-3.5" />
								</button>
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
							<span className="mb-3 block text-base text-muted-foreground">
								{String(index + 1).padStart(2, "0")}
							</span>
							<input
								name="caseStudyTitle"
								value={section.title}
								placeholder="제목 없음"
								className="block w-full border-0 bg-transparent pr-24 text-2xl font-semibold tracking-[-0.025em] outline-none placeholder:text-muted-foreground/45 sm:text-3xl"
								onChange={(event) =>
									update(section.id, { title: event.target.value })
								}
								required
							/>
							<textarea
								name="caseStudyBody"
								value={section.body}
								placeholder="내용을 입력하세요..."
								className="mt-4 min-h-32 w-full resize-none border-0 bg-transparent text-base leading-7 outline-none [field-sizing:content] placeholder:text-muted-foreground/45"
								onChange={(event) =>
									update(section.id, { body: event.target.value })
								}
								required
							/>
							<input
								type="hidden"
								name="caseStudyImageUrl"
								value={section.imageUrl}
							/>

							{section.imageUrl ? (
								<div className="mt-5 overflow-hidden rounded-lg border bg-muted/20">
									<div
										className="aspect-video bg-cover bg-center"
										style={{ backgroundImage: `url(${section.imageUrl})` }}
									/>
									<div className="flex items-center justify-between gap-3 px-3 py-2">
										<span className="truncate text-base text-muted-foreground">
											{uploadStatus[section.id] || "이미지"}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => update(section.id, { imageUrl: "" })}
										>
											이미지 제거
										</Button>
									</div>
								</div>
							) : (
								<label
									className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-center text-muted-foreground transition-colors hover:border-ring hover:bg-muted/30"
									onDragOver={(event) => {
										if (event.dataTransfer.types.includes("Files"))
											event.preventDefault();
									}}
									onDrop={(event) => acceptImageDrop(event, section.id)}
								>
									<ImagePlus className="mb-2 size-5" />
									<span className="text-base">
										이미지를 선택하거나 여기에 드롭
									</span>
									<span className="mt-1 text-base">
										JPG, PNG, WebP, GIF · 최대 10MB
									</span>
									{uploadStatus[section.id] && (
										<span className="mt-2 text-base">
											{uploadStatus[section.id]}
										</span>
									)}
									<input
										className="hidden"
										type="file"
										accept="image/jpeg,image/png,image/webp,image/gif"
										onChange={(event) =>
											void uploadImage(section.id, event.target.files?.[0])
										}
									/>
								</label>
							)}

							{section.showCode ? (
								<div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-[#0d0d0d] text-zinc-100">
									<div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
										<input
											name="caseStudyCodeLanguage"
											value={section.codeLanguage}
											placeholder="typescript"
											aria-label="코드 언어"
											className="w-40 border-0 bg-transparent font-mono text-base text-zinc-400 outline-none placeholder:text-zinc-600"
											onChange={(event) =>
												update(section.id, { codeLanguage: event.target.value })
											}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="text-zinc-400 hover:bg-white/10 hover:text-white"
											onClick={() =>
												update(section.id, {
													showCode: false,
													code: "",
													codeLanguage: "",
												})
											}
										>
											코드 제거
										</Button>
									</div>
									<textarea
										name="caseStudyCode"
										value={section.code}
										placeholder="코드를 입력하세요..."
										className="min-h-44 w-full resize-y border-0 bg-transparent p-4 font-mono text-base leading-6 outline-none placeholder:text-zinc-700"
										onChange={(event) =>
											update(section.id, { code: event.target.value })
										}
									/>
								</div>
							) : (
								<>
									<input type="hidden" name="caseStudyCodeLanguage" value="" />
									<input type="hidden" name="caseStudyCode" value="" />
									<Button
										type="button"
										variant="ghost"
										className="mt-3 text-muted-foreground"
										onClick={() => update(section.id, { showCode: true })}
									>
										<Code2 /> 코드 블록 추가
									</Button>
								</>
							)}
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
							{
								id: crypto.randomUUID(),
								title: "",
								body: "",
								imageUrl: "",
								code: "",
								codeLanguage: "",
								showCode: false,
							},
						])
					}
				>
					<Plus /> 새 섹션
				</Button>
			</form>
		</main>
	);
};
