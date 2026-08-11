import type { Entry, EntryKind } from "@suk/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { removeEntry, saveEntry } from "../actions";

const labels: Record<EntryKind, string> = {
	experience: "경력",
	education: "학력",
	award: "수상",
	activity: "활동",
	certificate: "자격",
};

const EntryForm = ({ kind, entry }: { kind: EntryKind; entry?: Entry }) => (
	<Card>
		<CardHeader>
			<h2 className="font-semibold">{entry?.title ?? `새 ${labels[kind]}`}</h2>
		</CardHeader>
		<CardContent>
			<form action={saveEntry} className="grid gap-3 md:grid-cols-2">
				<input type="hidden" name="id" value={entry?.id ?? ""} />
				<input type="hidden" name="kind" value={kind} />
				<Input
					name="title"
					placeholder="제목 / 역할"
					defaultValue={entry?.title}
					required
				/>
				<Input
					name="organization"
					placeholder="기관 / 회사"
					defaultValue={entry?.organization}
				/>
				<Input
					name="startDate"
					placeholder="시작 (2024.11)"
					defaultValue={entry?.startDate}
				/>
				<Input
					name="endDate"
					placeholder="종료 (현재)"
					defaultValue={entry?.endDate}
				/>
				<Textarea
					name="description"
					placeholder="설명"
					defaultValue={entry?.description}
					className="md:col-span-2"
				/>
				<Input name="url" placeholder="관련 URL" defaultValue={entry?.url} />
				<Input
					name="sortOrder"
					type="number"
					defaultValue={entry?.sortOrder ?? 0}
				/>
				<label className="flex items-center gap-2 text-base">
					<input
						name="visible"
						type="checkbox"
						defaultChecked={entry?.visible ?? true}
					/>
					공개
				</label>
				<div className="flex gap-2 md:col-span-2">
					<Button>저장</Button>
					{entry && (
						<Button formAction={removeEntry} variant="destructive">
							삭제
						</Button>
					)}
				</div>
			</form>
		</CardContent>
	</Card>
);

export const EntriesSection = ({
	kind,
	entries,
}: {
	kind: EntryKind;
	entries: Entry[];
}) => (
	<>
		<header className="mb-8">
			<p className="text-base text-muted-foreground">Timeline</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">
				{labels[kind]} 관리
			</h1>
		</header>
		<div className="grid gap-5 xl:grid-cols-2">
			<EntryForm kind={kind} />
			{entries.map((entry) => (
				<EntryForm key={entry.id} kind={kind} entry={entry} />
			))}
		</div>
	</>
);
