"use client";

import {
	fileMoveSchema,
	fileSlugSchema,
	objectKeySchema,
	type FileOperationPlan,
	type StorageObject,
	type StoredFile,
} from "@suk/contracts";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fileRequest } from "@/features/files/client";

export const FileRow = ({
	objectKey,
	object,
	onOpen,
	onChanged,
}: {
	objectKey: string;
	object?: StorageObject;
	onOpen?: () => void;
	onChanged: () => void;
}) => {
	const folder = objectKey.endsWith("/");
	const [slug, setSlug] = useState(object?.mapping?.slug ?? "");
	const [mapping, setMapping] = useState(object?.mapping ?? null);
	const [destination, setDestination] = useState(objectKey);
	const [operation, setOperation] = useState<{
		kind: "move" | "delete";
		destinationKey?: string;
		plan: FileOperationPlan;
	} | null>(null);
	const [confirmation, setConfirmation] = useState("");
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState(false);
	const running = useRef(false);
	const run = async (action: () => Promise<void>) => {
		if (running.current) return;
		running.current = true;
		setPending(true);
		setError(false);
		setMessage("");
		try {
			await action();
		} catch (error) {
			setError(true);
			setMessage(
				error instanceof Error ? error.message : "파일 작업에 실패했습니다.",
			);
		} finally {
			running.current = false;
			setPending(false);
		}
	};
	const prepare = (kind: "move" | "delete") =>
		run(async () => {
			objectKeySchema.parse(objectKey);
			const destinationKey =
				kind === "move"
					? fileMoveSchema.parse({
							objectKey,
							destinationKey: destination,
							objects: [],
						}).destinationKey
					: undefined;
			const plan = await fileRequest<FileOperationPlan>(
				`/api/files/objects/plan?${new URLSearchParams({ objectKey })}`,
				"GET",
				undefined,
				300_000,
			);
			setConfirmation("");
			setOperation({ kind, destinationKey, plan });
		});
	const requiresConfirmation = Boolean(
		operation &&
		(operation.plan.requiresConfirmation ||
			objectKey.startsWith("assets/") ||
			operation.destinationKey?.startsWith("assets/")),
	);
	return (
		<div
			className="space-y-3 rounded-lg border bg-card p-3"
			aria-busy={pending}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				{folder ? (
					<Button
						type="button"
						variant="link"
						className="h-auto max-w-full justify-start whitespace-normal break-all p-0 text-left"
						disabled={pending}
						onClick={onOpen}
					>
						폴더 · {objectKey}
					</Button>
				) : (
					<a
						href={object?.publicUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="break-all text-sm underline"
					>
						{objectKey}
					</a>
				)}
				{object && (
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={pending}
						onClick={() =>
							void run(async () => {
								await navigator.clipboard.writeText(object.publicUrl);
								setMessage("공개 URL을 복사했습니다.");
							})
						}
					>
						공개 URL 복사
					</Button>
				)}
			</div>
			{object && (
				<p className="text-sm text-muted-foreground">
					{object.size.toLocaleString()} bytes ·{" "}
					{object.contentType || "유형 정보 없음"} ·{" "}
					{object.lastModified
						? new Date(object.lastModified).toLocaleString()
						: "수정일 정보 없음"}
				</p>
			)}
			{!folder && (
				<form
					className="flex flex-wrap items-end gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						void run(async () => {
							if (!slug.trim() && !mapping) return;
							const value = fileSlugSchema.parse(
								slug.trim()
									? { objectKey, slug: slug.trim() }
									: { id: mapping!.id, slug: null },
							);
							const saved = await fileRequest<StoredFile | undefined>(
								"/api/files",
								"POST",
								value,
							);
							setMapping(saved ?? null);
							setSlug(saved?.slug ?? "");
							setMessage(
								value.slug
									? "단축 링크를 저장했습니다."
									: "단축 링크를 제거했습니다. 파일은 유지됩니다.",
							);
							onChanged();
						});
					}}
				>
					<label className="min-w-0 flex-1 space-y-1 text-sm">
						단축 링크 (선택)
						<Input
							value={slug}
							disabled={pending}
							maxLength={160}
							onChange={(event) => setSlug(event.target.value)}
							placeholder="비워 두면 단축 링크 제거"
						/>
					</label>
					<Button type="submit" size="sm" disabled={pending}>
						{pending ? "처리 중…" : "단축 링크 저장"}
					</Button>
					{mapping && (
						<>
							<a
								className="p-1 text-sm underline"
								href={`/${encodeURIComponent(mapping.slug)}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								/{mapping.slug}
							</a>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={pending}
								onClick={() =>
									void run(async () => {
										await navigator.clipboard.writeText(
											`${window.location.origin}/${encodeURIComponent(mapping.slug)}`,
										);
										setMessage("단축 링크를 복사했습니다.");
									})
								}
							>
								단축 링크 복사
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={pending}
								onClick={() =>
									void run(async () => {
										await fileRequest("/api/files", "POST", {
											id: mapping.id,
											slug: null,
										});
										setMapping(null);
										setSlug("");
										setMessage("단축 링크를 제거했습니다. 파일은 유지됩니다.");
										onChanged();
									})
								}
							>
								단축 링크 제거
							</Button>
						</>
					)}
				</form>
			)}
			<form
				className="flex flex-wrap items-end gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					void prepare("move");
				}}
			>
				<label className="min-w-0 flex-1 space-y-1 text-sm">
					이름 변경 / 이동할 전체 경로{folder ? " (끝에 / 필수)" : ""}
					<Input
						value={destination}
						disabled={pending}
						required
						onChange={(event) => setDestination(event.target.value)}
					/>
				</label>
				<Button
					type="submit"
					size="sm"
					variant="outline"
					disabled={pending || !objectKey || destination === objectKey}
				>
					이동 검토
				</Button>
				<Button
					type="button"
					size="sm"
					variant="destructive"
					disabled={pending || !objectKey}
					onClick={() => void prepare("delete")}
				>
					삭제 검토
				</Button>
			</form>
			{pending && (
				<p role="status" className="text-sm text-muted-foreground">
					처리 중…
				</p>
			)}
			{message && (
				<p
					role={error ? "alert" : "status"}
					className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
				>
					{message}
				</p>
			)}
			<Dialog
				open={operation !== null}
				onOpenChange={(open) => {
					if (!open && !pending) setOperation(null);
				}}
			>
				<DialogContent showCloseButton={!pending}>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							if (
								!operation ||
								(requiresConfirmation && confirmation !== "assets/")
							)
								return;
							void run(async () => {
								await fileRequest(
									"/api/files/objects",
									operation.kind === "move" ? "PATCH" : "DELETE",
									{
										objectKey,
										...(operation.kind === "move"
											? { destinationKey: operation.destinationKey }
											: {}),
										objects: operation.plan.objects,
										...(requiresConfirmation ? { confirmation } : {}),
									},
									300_000,
								);
								setOperation(null);
								setMessage(
									operation.kind === "move" ? "이동했습니다." : "삭제했습니다.",
								);
								onChanged();
							});
						}}
					>
						<DialogHeader>
							<DialogTitle>
								{folder ? "폴더와 모든 하위 객체를" : "파일을"}{" "}
								{operation?.kind === "move"
									? "이동할까요?"
									: "영구 삭제할까요?"}
							</DialogTitle>
							<DialogDescription className="break-all">
								/{objectKey}
								{operation?.kind === "move"
									? ` → /${operation.destinationKey}. 대상에 내용이 다른 파일이 있으면 이동할 수 없습니다. 실패한 이동은 목록을 새로고침한 뒤 다시 검토하세요.`
									: ". 삭제한 파일은 복구할 수 없습니다."}
							</DialogDescription>
						</DialogHeader>
						<p className="text-sm">
							대상 {operation?.plan.count.toLocaleString()}개 ·{" "}
							{operation?.plan.bytes.toLocaleString()} bytes
							{folder ? " (폴더 마커 포함, 하위 폴더 재귀 처리)" : ""}
						</p>
						{requiresConfirmation && (
							<label className="block space-y-2 text-sm text-destructive">
								운영 포트폴리오에 영향을 줍니다. 확인하려면 assets/를
								입력하세요.
								<Input
									aria-label="파일 작업 확인: assets/"
									value={confirmation}
									disabled={pending}
									onChange={(event) => setConfirmation(event.target.value)}
									autoComplete="off"
									required
								/>
							</label>
						)}
						{message && error && (
							<p role="alert" className="text-sm text-destructive">
								{message}
							</p>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								disabled={pending}
								onClick={() => setOperation(null)}
							>
								취소
							</Button>
							{error && (
								<Button
									type="button"
									variant="outline"
									disabled={pending}
									onClick={() => {
										setOperation(null);
										onChanged();
									}}
								>
									닫고 목록 새로고침
								</Button>
							)}
							<Button
								type="submit"
								variant="destructive"
								disabled={
									pending ||
									(requiresConfirmation && confirmation !== "assets/")
								}
							>
								{pending
									? "처리 중…"
									: operation?.kind === "move"
										? `${operation.plan.count}개 이동 확인`
										: `${operation?.plan.count}개 영구 삭제`}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};
