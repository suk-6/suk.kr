import type { StoredFile } from "@suk/contracts";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { removeFile, updateFile } from "../actions";
import { FileUpload } from "../upload";

export const FilesSection = ({ files }: { files: StoredFile[] }) => (
	<>
		<header className="mb-8">
			<p className="text-sm text-zinc-500">SSFS</p>
			<h1 className="mt-1 text-3xl font-semibold tracking-tight">파일 관리</h1>
		</header>
		<Card>
			<CardHeader>
				<h2 className="font-semibold">파일 업로드</h2>
				<p className="mt-1 text-sm text-zinc-500">
					선택한 파일명으로 slug와 fileName이 자동 입력됩니다.
				</p>
			</CardHeader>
			<CardContent>
				<FileUpload />
			</CardContent>
		</Card>
		<Card className="mt-6">
			<CardHeader>
				<h2 className="font-semibold">파일 {files.length}개</h2>
			</CardHeader>
			<CardContent className="space-y-2">
				{files.map((file) => (
					<form
						action={updateFile}
						key={file.id}
						className="grid gap-2 rounded-lg border border-zinc-200 p-3 md:grid-cols-[1fr_1fr_8rem_auto]"
					>
						<input type="hidden" name="id" value={file.id} />
						<input type="hidden" name="objectKey" value={file.objectKey} />
						<Input name="slug" defaultValue={file.slug} />
						<Input name="fileName" defaultValue={file.fileName} />
						<span className="self-center text-xs text-zinc-500">
							{(file.size / 1024 / 1024).toFixed(1)} MB
						</span>
						<div className="flex items-center gap-2">
							<Button size="sm">저장</Button>
							<Button size="sm" variant="destructive" formAction={removeFile}>
								삭제
							</Button>
							<a
								href={file.publicUrl}
								target="_blank"
								aria-label="파일 열기"
								rel="noopener"
							>
								<ExternalLink size={16} />
							</a>
						</div>
					</form>
				))}
			</CardContent>
		</Card>
	</>
);
