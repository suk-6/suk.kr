"use client";

import type { BrokenFileLinks, StoredFile } from "@suk/contracts";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { fileRequest } from "@/features/files/client";

export const BrokenLinks = ({ onChanged }: { onChanged: () => void }) => {
	const [files, setFiles] = useState<StoredFile[]>([]);
	const [nextOffset, setNextOffset] = useState<number | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [removing, setRemoving] = useState<StoredFile | null>(null);
	const running = useRef(false);
	const scan = async (offset: number) => {
		if (running.current) return;
		running.current = true;
		setPending(true);
		setError("");
		setMessage("");
		try {
			const page = await fileRequest<BrokenFileLinks>(
				`/api/files/broken?offset=${offset}`,
			);
			setFiles((current) =>
				offset === 0
					? page.files
					: [
							...current,
							...page.files.filter(
								(file) => !current.some((existing) => existing.id === file.id),
							),
						],
			);
			setNextOffset(page.nextOffset);
			setLoaded(true);
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "끊어진 링크를 확인하지 못했습니다.",
			);
		} finally {
			running.current = false;
			setPending(false);
		}
	};
	return (
		<Card className="mt-6">
			<CardHeader>
				<h2 className="font-semibold">끊어진 단축 링크</h2>
				<p className="text-sm text-muted-foreground">
					assets/의 기존 링크를 포함해 연결된 S3 객체를 HEAD로 확인합니다. 한
					번에 매핑 20개를 검사합니다.
				</p>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={pending}
						onClick={() => void scan(0)}
					>
						{pending ? "처리 중…" : "끊어진 링크 검사 / 처음부터 다시 검사"}
					</Button>
					{nextOffset !== null && (
						<Button
							type="button"
							variant="outline"
							disabled={pending}
							onClick={() => void scan(nextOffset)}
						>
							다음 20개 검사
						</Button>
					)}
				</div>
				{pending && (
					<p role="status" className="text-sm text-muted-foreground">
						검사 또는 링크 제거 중…
					</p>
				)}
				{error && (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				)}
				{message && (
					<p role="status" className="text-sm text-muted-foreground">
						{message}
					</p>
				)}
				{loaded && (
					<p role="status" className="text-sm text-muted-foreground">
						끊어진 링크 {files.length}개
						{nextOffset !== null
							? " · 검사할 매핑이 더 있습니다."
							: " · 전체 검사를 마쳤습니다."}
					</p>
				)}
				{files.map((file) => (
					<div
						key={file.id}
						className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
					>
						<div className="min-w-0 space-y-1 text-sm">
							<a
								className="break-all underline"
								href={`/${encodeURIComponent(file.slug)}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								/{file.slug}
							</a>
							<p className="break-all text-muted-foreground">
								{file.objectKey}
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							variant="destructive"
							disabled={pending}
							onClick={() => {
								setError("");
								setRemoving(file);
							}}
						>
							단축 링크 제거
						</Button>
					</div>
				))}
			</CardContent>
			<Dialog
				open={removing !== null}
				onOpenChange={(open) => {
					if (!open && !pending) setRemoving(null);
				}}
			>
				<DialogContent showCloseButton={!pending}>
					<form
						className="space-y-4"
						onSubmit={async (event) => {
							event.preventDefault();
							if (!removing || running.current) return;
							running.current = true;
							setPending(true);
							setError("");
							setMessage("");
							try {
								await fileRequest("/api/files", "POST", {
									id: removing.id,
									slug: null,
								});
								setFiles((current) =>
									current.filter((file) => file.id !== removing.id),
								);
								// Removing a scanned mapping shifts the remaining offset by one.
								setNextOffset((current) =>
									current === null ? null : Math.max(0, current - 1),
								);
								setRemoving(null);
								setMessage("단축 링크를 제거했습니다.");
								onChanged();
							} catch (error) {
								setError(
									error instanceof Error
										? error.message
										: "단축 링크를 제거하지 못했습니다.",
								);
							} finally {
								running.current = false;
								setPending(false);
							}
						}}
					>
						<DialogHeader>
							<DialogTitle>끊어진 단축 링크를 제거할까요?</DialogTitle>
							<DialogDescription className="break-all">
								/{removing?.slug}의 연결 정보만 제거합니다. S3 파일은 변경하지
								않습니다.
							</DialogDescription>
						</DialogHeader>
						{error && (
							<p role="alert" className="text-sm text-destructive">
								{error}
							</p>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={pending}
								onClick={() => setRemoving(null)}
							>
								취소
							</Button>
							<Button type="submit" variant="destructive" disabled={pending}>
								{pending ? "제거 중…" : "단축 링크 제거"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</Card>
	);
};
