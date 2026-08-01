import type { Skill } from "@suk/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { removeSkill, saveSkill } from "../actions";

const SkillForm = ({ skill }: { skill?: Skill }) => (
	<form
		action={saveSkill}
		className="grid gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-[1fr_1fr_6rem_auto]"
	>
		<input type="hidden" name="id" value={skill?.id ?? ""} />
		<Input name="name" placeholder="기술" defaultValue={skill?.name} required />
		<Input
			name="groupName"
			placeholder="그룹"
			defaultValue={skill?.groupName}
			required
		/>
		<Input
			name="sortOrder"
			type="number"
			defaultValue={skill?.sortOrder ?? 0}
		/>
		<div className="flex gap-2">
			<Button size="sm">저장</Button>
			{skill && (
				<Button
					size="sm"
					variant="destructive"
					formAction={removeSkill}
					name="id"
					value={skill.id}
				>
					삭제
				</Button>
			)}
		</div>
	</form>
);

export const SkillsSection = ({ skills }: { skills: Skill[] }) => (
	<>
		<header className="mb-8">
			<p className="text-sm text-zinc-500">Toolkit</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">기술 관리</h1>
		</header>
		<Card>
			<CardHeader>
				<h2 className="font-semibold">스킬과 그룹</h2>
			</CardHeader>
			<CardContent className="space-y-2">
				<SkillForm />
				{skills.map((skill) => (
					<SkillForm key={skill.id} skill={skill} />
				))}
			</CardContent>
		</Card>
	</>
);
