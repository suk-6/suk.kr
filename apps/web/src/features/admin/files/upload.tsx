"use client";

import {
	fileUploadSchema,
	type FileOperationPlan,
	type SignedFileUpload,
} from "@suk/contracts";
import { UploadCloud } from "lucide-react";
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
import {
	FileRequestError,
	fileRequest,
	uploadBytes,
} from "@/features/files/client";

type Upload = {
	id: number;
	file: File;
	objectKey: string;
	status: string;
	progress: number;
	error: boolean;
	done: boolean;
	conflict?: boolean;
	overwrite?: boolean;
	etag?: string;
	confirmation?: string;
	signed?: SignedFileUpload;
};

export const FileUpload = ({
	prefix,
	onChanged,
}: {
	prefix: string;
	onChanged: () => void;
}) => {
	const [items, setItems] = useState<Upload[]>([]);
	const [pending, setPending] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [confirm, setConfirm] = useState<Upload | null>(null);
	const [confirmation, setConfirmation] = useState("");
	const running = useRef(false);
	const nextId = useRef(0);
	const add = (files: FileList | File[]) => {
		if (running.current) return;
		const added = Array.from(files).map((file) => ({
			id: ++nextId.current,
			file,
			objectKey: prefix + file.name,
			status: "대기 중",
			progress: 0,
			error: false,
			done: false,
		}));
		setItems((current) => [...current, ...added]);
	};
	const patch = (id: number, value: Partial<Upload>) =>
		setItems((current) =>
			current.map((item) => (item.id === id ? { ...item, ...value } : item)),
		);
	const upload = async (values: Upload[]) => {
		if (running.current) return;
		running.current = true;
		setPending(true);
		try {
			for (const item of values) {
				try {
					patch(item.id, {
						error: false,
						conflict: false,
						status: "업로드 준비 중…",
					});
					const value = fileUploadSchema.parse({
						objectKey: item.objectKey,
						contentType: item.file.type || "application/octet-stream",
						size: item.file.size,
						overwrite: item.overwrite ?? false,
						etag: item.etag,
						confirmation: item.confirmation,
					});
					let signed = item.signed;
					// Retry the same key after expiry or a failed conditional PUT.
					for (let attempt = 0; attempt < 2; attempt++) {
						if (!signed || signed.expiresAt <= Date.now() + 30_000) {
							signed = await fileRequest<SignedFileUpload>(
								"/api/files/sign",
								"POST",
								value,
							);
							patch(item.id, { signed });
						}
						patch(item.id, { status: "S3 업로드 중…" });
						try {
							await uploadBytes(
								signed.uploadUrl,
								item.file,
								signed.contentType,
								signed.headers,
								(progress) => patch(item.id, { progress }),
							);
							break;
						} catch (error) {
							if (
								error instanceof FileRequestError &&
								[403, 412].includes(error.status)
							) {
								signed = undefined;
								patch(item.id, { signed: undefined });
								if (attempt === 0) continue;
							}
							throw error;
						}
					}
					patch(item.id, {
						done: true,
						progress: 100,
						status: "업로드 완료",
						error: false,
					});
				} catch (error) {
					const conflict =
						error instanceof FileRequestError && error.status === 409;
					patch(item.id, {
						error: true,
						conflict,
						...(conflict
							? { signed: undefined, overwrite: false, confirmation: undefined }
							: {}),
						status: conflict
							? "같은 경로에 파일이 있습니다. 덮어쓰기를 확인하세요."
							: error instanceof Error
								? error.message
								: "업로드에 실패했습니다. 같은 경로로 재시도하세요.",
					});
				}
			}
		} finally {
			running.current = false;
			setPending(false);
			onChanged();
		}
	};
	return (
		<>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					void upload(items.filter((item) => !item.done && !item.conflict));
				}}
			>
				<div
					onDragEnter={(event) => {
						event.preventDefault();
						if (!pending) setDragging(true);
					}}
					onDragOver={(event) => {
						event.preventDefault();
						event.dataTransfer.dropEffect = pending ? "none" : "copy";
					}}
					onDragLeave={(event) => {
						if (
							!event.currentTarget.contains(event.relatedTarget as Node | null)
						)
							setDragging(false);
					}}
					onDrop={(event) => {
						event.preventDefault();
						setDragging(false);
						add(event.dataTransfer.files);
					}}
					className={`space-y-3 rounded-lg border-2 border-dashed p-6 text-center ${dragging ? "border-primary bg-accent" : "border-input"}`}
				>
					<UploadCloud className="mx-auto text-muted-foreground" />
					<p>여러 파일을 놓거나 선택하세요. 원래 파일명으로 업로드합니다.</p>
					<p className="break-all text-sm text-muted-foreground">
						업로드 폴더: /{prefix}
					</p>
					<Input
						aria-label="업로드할 파일 선택"
						type="file"
						multiple
						disabled={pending}
						onChange={(event) => {
							if (event.target.files) add(event.target.files);
							event.target.value = "";
						}}
					/>
				</div>
				{items.map((item) => (
					<div key={item.id} className="space-y-2 rounded-lg border p-3">
						<p className="break-all text-sm">
							{item.objectKey} · {item.file.size.toLocaleString()} bytes
						</p>
						<progress
							aria-label={`${item.objectKey} 업로드 진행률`}
							value={item.progress}
							max={100}
							className="h-2 w-full accent-primary"
						/>
						<p
							role={item.error ? "alert" : "status"}
							className={`text-sm ${item.error ? "text-destructive" : "text-muted-foreground"}`}
						>
							{item.status}
						</p>
						<div className="flex gap-2">
							{item.conflict && (
								<Button
									type="button"
									variant="destructive"
									size="sm"
									disabled={pending}
									onClick={async () => {
										if (running.current) return;
										running.current = true;
										setPending(true);
										try {
											const plan = await fileRequest<FileOperationPlan>(
												`/api/files/objects/plan?${new URLSearchParams({ objectKey: item.objectKey })}`,
											);
											const etag = plan.objects[0]?.etag;
											if (!etag)
												throw new Error(
													"대상 파일이 없습니다. 목록을 새로고침하세요.",
												);
											setConfirmation("");
											setConfirm({ ...item, etag });
										} catch (error) {
											patch(item.id, {
												error: true,
												status:
													error instanceof Error
														? error.message
														: "대상 파일을 확인하지 못했습니다.",
											});
										} finally {
											running.current = false;
											setPending(false);
										}
									}}
								>
									덮어쓰기 확인
								</Button>
							)}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={pending}
								onClick={() =>
									setItems((current) =>
										current.filter(({ id }) => id !== item.id),
									)
								}
							>
								목록에서 제거
							</Button>
						</div>
					</div>
				))}
				<Button
					type="submit"
					disabled={
						pending || !items.some((item) => !item.done && !item.conflict)
					}
				>
					{pending ? "업로드 중…" : "업로드 / 재시도"}
				</Button>
			</form>
			<Dialog
				open={confirm !== null}
				onOpenChange={(open) => {
					if (!pending && !open) setConfirm(null);
				}}
			>
				<DialogContent showCloseButton={!pending}>
					<form
						className="space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							if (
								!confirm ||
								(confirm.objectKey.startsWith("assets/") &&
									confirmation !== "assets/")
							)
								return;
							const item = {
								...confirm,
								overwrite: true,
								confirmation,
								signed: undefined,
								conflict: false,
							};
							patch(item.id, item);
							setConfirm(null);
							void upload([item]);
						}}
					>
						<DialogHeader>
							<DialogTitle>기존 파일을 덮어쓸까요?</DialogTitle>
							<DialogDescription className="break-all">
								{confirm?.objectKey}의 기존 내용을 교체합니다. 되돌릴 수
								없습니다.
							</DialogDescription>
						</DialogHeader>
						{confirm?.objectKey.startsWith("assets/") && (
							<label className="block space-y-2 text-sm text-destructive">
								운영 포트폴리오에 영향을 줍니다. 확인하려면 assets/를
								입력하세요.
								<Input
									aria-label="덮어쓰기 확인: assets/"
									value={confirmation}
									onChange={(event) => setConfirmation(event.target.value)}
									autoComplete="off"
									required
								/>
							</label>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setConfirm(null)}
							>
								취소
							</Button>
							<Button
								type="submit"
								variant="destructive"
								disabled={
									pending ||
									(confirm?.objectKey.startsWith("assets/") &&
										confirmation !== "assets/")
								}
							>
								덮어쓰기
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
};
