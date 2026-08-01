import type { Project } from "@suk/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { removeProject, saveProject } from "../actions";

const ProjectForm = ({ project }: { project?: Project }) => (
	<Card>
		<CardHeader>
			<h2 className="font-semibold">{project?.name ?? "새 프로젝트"}</h2>
		</CardHeader>
		<CardContent>
			<form action={saveProject} className="grid gap-3 md:grid-cols-2">
				<input type="hidden" name="id" value={project?.id ?? ""} />
				<Input
					name="name"
					placeholder="프로젝트 이름"
					defaultValue={project?.name}
					required
				/>
				<Input
					name="slug"
					placeholder="slug"
					defaultValue={project?.slug}
					required
				/>
				<Input
					name="subtitle"
					placeholder="한 줄 설명"
					defaultValue={project?.subtitle}
					className="md:col-span-2"
				/>
				<Textarea
					name="description"
					placeholder="설명"
					defaultValue={project?.description}
					required
					className="md:col-span-2"
				/>
				<Input
					name="coverUrl"
					placeholder="커버 이미지 URL"
					defaultValue={project?.coverUrl}
					className="md:col-span-2"
				/>
				<Input
					name="projectUrl"
					placeholder="프로젝트 URL"
					defaultValue={project?.projectUrl}
				/>
				<Input
					name="repoUrl"
					placeholder="Repository URL"
					defaultValue={project?.repoUrl}
				/>
				<Textarea
					name="tags"
					placeholder="태그 — 한 줄에 하나"
					defaultValue={project?.tags.join("\n")}
				/>
				<Textarea
					name="highlights"
					placeholder="하이라이트 — 한 줄에 하나"
					defaultValue={project?.highlights.join("\n")}
				/>
				<Input
					name="sortOrder"
					type="number"
					defaultValue={project?.sortOrder ?? 0}
				/>
				<label className="flex items-center gap-2 text-sm">
					<input
						name="visible"
						type="checkbox"
						defaultChecked={project?.visible ?? true}
					/>
					공개
				</label>
				<div className="flex gap-2 md:col-span-2">
					<Button>저장</Button>
					{project && (
						<Button formAction={removeProject} variant="destructive">
							삭제
						</Button>
					)}
				</div>
			</form>
		</CardContent>
	</Card>
);

export const ProjectsSection = ({ projects }: { projects: Project[] }) => (
	<>
		<header className="mb-8">
			<p className="text-sm text-muted-foreground">Portfolio</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">
				프로젝트 관리
			</h1>
		</header>
		<div className="grid gap-5 xl:grid-cols-2">
			<ProjectForm />
			{projects.map((project) => (
				<ProjectForm key={project.id} project={project} />
			))}
		</div>
	</>
);
