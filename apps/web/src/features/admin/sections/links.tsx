import type { ShortLink } from "@suk/contracts";
import { ExternalLink, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { removeLink, saveLink } from "../actions";

const LinkForm = ({ link }: { link?: ShortLink }) => {
	const managed = link?.source === "file";
	return (
		<form
			action={saveLink}
			className="grid gap-2 rounded-lg border bg-card p-3 md:grid-cols-[12rem_1fr_12rem_auto]"
		>
			<input type="hidden" name="previousSlug" value={link?.slug ?? ""} />
			<Input
				name="slug"
				placeholder="slug"
				defaultValue={link?.slug}
				required
				readOnly={managed}
			/>
			<Input
				name="targetUrl"
				type="url"
				placeholder="https://"
				defaultValue={link?.targetUrl}
				required
				readOnly={managed}
			/>
			<Input
				name="password"
				type="password"
				placeholder={link?.passwordHash ? "변경할 비밀번호" : "비밀번호 (선택)"}
				readOnly={managed}
			/>
			<div className="flex items-center gap-2">
				{managed ? (
					<Badge>
						<LockKeyhole size={12} className="mr-1" />
						파일 관리
					</Badge>
				) : (
					<>
						<Button size="sm">저장</Button>
						{link && (
							<Button size="sm" variant="destructive" formAction={removeLink}>
								삭제
							</Button>
						)}
					</>
				)}{" "}
				{link && (
					<a
						href={`/${link.slug}`}
						target="_blank"
						aria-label="열기"
						rel="noopener"
					>
						<ExternalLink size={16} />
					</a>
				)}
			</div>
		</form>
	);
};

export const LinksSection = ({ links }: { links: ShortLink[] }) => (
	<>
		<header className="mb-8">
			<p className="text-sm text-muted-foreground">Redirects</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">
				단축 URL 관리
			</h1>
		</header>
		<Card>
			<CardHeader>
				<h2 className="font-semibold">suk.kr/slug</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					파일에서 생성된 항목은 파일 관리에서만 변경할 수 있습니다.
				</p>
			</CardHeader>
			<CardContent className="space-y-2">
				<LinkForm />
				{links.map((link) => (
					<LinkForm key={link.slug} link={link} />
				))}
			</CardContent>
		</Card>
	</>
);
