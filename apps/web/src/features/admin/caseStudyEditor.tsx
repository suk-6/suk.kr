"use client";

import type { Project } from "@suk/contracts";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Section = Project["caseStudy"][number] & { id: string };

export const CaseStudyEditor = ({
	value = [],
}: {
	value?: Project["caseStudy"];
}) => {
	const [sections, setSections] = useState<Section[]>(() =>
		value.map((section, index) => ({ ...section, id: String(index) })),
	);

	return (
		<fieldset className="grid gap-3 rounded-lg border p-4 md:col-span-2">
			<div className="flex items-start justify-between gap-4">
				<div>
					<legend className="font-medium">케이스 스터디</legend>
					<p className="mt-1 text-sm text-muted-foreground">
						상세 페이지에 표시할 제목과 본문을 순서대로 작성하세요.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						setSections((current) => [
							...current,
							{ id: crypto.randomUUID(), title: "", body: "" },
						])
					}
				>
					<Plus /> 섹션 추가
				</Button>
			</div>

			{sections.length === 0 ? (
				<p className="rounded-md bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
					아직 작성된 섹션이 없습니다.
				</p>
			) : (
				<div className="grid gap-4">
					{sections.map((section, index) => (
						<div
							className="grid gap-2 rounded-md bg-muted/30 p-3"
							key={section.id}
						>
							<div className="flex items-center justify-between gap-3">
								<span className="text-sm font-medium">섹션 {index + 1}</span>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
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
							<Input
								name="caseStudyTitle"
								placeholder="섹션 제목"
								value={section.title}
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
							<Textarea
								name="caseStudyBody"
								placeholder="본문"
								value={section.body}
								onChange={(event) =>
									setSections((current) =>
										current.map((value) =>
											value.id === section.id
												? { ...value, body: event.target.value }
												: value,
										),
									)
								}
								className="min-h-32"
								required
							/>
						</div>
					))}
				</div>
			)}
		</fieldset>
	);
};
