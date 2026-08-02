import type { SiteNotice } from "@suk/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { removeNotice, saveNotice } from "../actions";

const localDateTime = (value?: string) =>
	value
		? new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000)
				.toISOString()
				.slice(0, 16)
		: "";

const NoticeForm = ({ notice }: { notice?: SiteNotice }) => (
	<Card>
		<CardHeader>
			<h2 className="font-semibold">{notice?.title ?? "새 공지"}</h2>
		</CardHeader>
		<CardContent>
			<form action={saveNotice} className="grid gap-4 md:grid-cols-2">
				<input type="hidden" name="id" value={notice?.id ?? ""} />
				<label className="text-sm md:col-span-2">
					제목
					<Input
						name="title"
						defaultValue={notice?.title}
						className="mt-1.5"
						required
					/>
				</label>
				<label className="text-sm md:col-span-2">
					내용
					<Textarea
						name="content"
						defaultValue={notice?.content}
						className="mt-1.5 min-h-28"
						required
					/>
				</label>
				<label className="text-sm">
					공개 시작
					<Input
						name="startsAt"
						type="datetime-local"
						defaultValue={localDateTime(notice?.startsAt)}
						className="mt-1.5"
					/>
				</label>
				<label className="text-sm">
					공개 종료
					<Input
						name="endsAt"
						type="datetime-local"
						defaultValue={localDateTime(notice?.endsAt)}
						className="mt-1.5"
					/>
				</label>
				<label className="text-sm">
					정렬 순서
					<Input
						name="sortOrder"
						type="number"
						defaultValue={notice?.sortOrder ?? 0}
						className="mt-1.5"
					/>
				</label>
				<label className="flex items-center gap-2 self-end pb-2 text-sm">
					<Switch name="visible" defaultChecked={notice?.visible ?? true} />
					공개
				</label>
				<div className="flex gap-2 md:col-span-2">
					<Button>저장</Button>
					{notice && (
						<Button formAction={removeNotice} variant="destructive">
							삭제
						</Button>
					)}
				</div>
			</form>
		</CardContent>
	</Card>
);

export const NoticesSection = ({ notices }: { notices: SiteNotice[] }) => (
	<>
		<header className="mb-8">
			<p className="text-sm text-muted-foreground">Notice</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">공지 관리</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				기간을 비워두면 제한 없이 공개됩니다.
			</p>
		</header>
		<div className="grid gap-5 xl:grid-cols-2">
			<NoticeForm />
			{notices.map((notice) => (
				<NoticeForm key={notice.id} notice={notice} />
			))}
		</div>
	</>
);
