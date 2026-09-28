"use client";

import { Lock, LockOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { changeNotePassword, saveNote, unlockNote } from "./actions";

export function NoteEditor({
	id,
	initialContent,
	initialLocked,
	hasPassword: initialHasPassword,
}: {
	id: string;
	initialContent: string;
	initialLocked: boolean;
	hasPassword: boolean;
}) {
	const [content, setContent] = useState(initialContent);
	const [locked, setLocked] = useState(initialLocked);
	const [hasPassword, setHasPassword] = useState(initialHasPassword);
	const [secret, setSecret] = useState("");
	const [setting, setSetting] = useState(false);
	const [status, setStatus] = useState("");
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pending = useRef<string | null>(null);
	const inFlight = useRef(0);
	const queue = useRef(Promise.resolve());
	const revision = useRef(0);

	useEffect(() => {
		const warn = (event: BeforeUnloadEvent) => {
			if (pending.current === null && inFlight.current === 0) return;
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, []);

	const save = () => {
		if (timer.current) clearTimeout(timer.current);
		const value = pending.current;
		if (value === null) return queue.current;
		pending.current = null;
		inFlight.current++;
		const current = revision.current;
		queue.current = queue.current
			.catch(() => undefined)
			.then(async () => {
				setStatus("저장 중…");
				await saveNote(id, value);
				if (revision.current === current) setStatus("저장 완료");
			})
			.catch((error: unknown) => {
				if (revision.current === current)
					setStatus(error instanceof Error ? error.message : "저장 실패");
				throw error;
			})
			.finally(() => {
				inFlight.current--;
			});
		return queue.current;
	};

	if (locked)
		return (
			<main className="flex min-h-svh items-center justify-center bg-[#090909] p-6 font-mono text-[#ecece8]">
				<form
					className="w-full max-w-sm space-y-6"
					onSubmit={async (event) => {
						event.preventDefault();
						try {
							const result = await unlockNote(id, secret);
							if (!result.ok) {
								setStatus("비밀번호가 올바르지 않습니다.");
								return;
							}
							setContent(result.content);
							setSecret("");
							setStatus("");
							setLocked(false);
						} catch {
							setStatus("잠금 해제에 실패했습니다.");
						}
					}}
				>
					<div className="flex items-center gap-2 text-sm text-[#999]">
						<Lock className="size-4" />
						<span>note / {id}</span>
					</div>
					<h1 className="text-xl">잠긴 노트</h1>
					<Input
						type="text"
						className="note-secret h-10 border-[#333] bg-[#161616]"
						value={secret}
						onChange={(event) => setSecret(event.target.value)}
						placeholder="비밀번호"
						autoComplete="off"
						data-1p-ignore
						data-lpignore="true"
						data-form-type="other"
						autoFocus
						required
					/>
					{status && (
						<p role="status" className="text-sm text-red-400">
							{status}
						</p>
					)}
					<Button type="submit" size="lg" className="w-full">
						열기
					</Button>
				</form>
			</main>
		);

	return (
		<main className="flex h-svh flex-col bg-[#090909] font-mono text-[#ecece8]">
			<header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#262626] px-5 text-sm">
				<span className="mr-auto">note / {id}</span>
				<span role="status" aria-live="polite" className="truncate text-[#999]">
					{status}
				</span>
				<Popover
					open={setting}
					onOpenChange={(open) => {
						setSetting(open);
						if (!open) setSecret("");
					}}
				>
					<PopoverTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
								title={hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
							/>
						}
					>
						{hasPassword ? (
							<Lock className="size-4" />
						) : (
							<LockOpen className="size-4" />
						)}
					</PopoverTrigger>
					<PopoverContent
						align="end"
						sideOffset={8}
						className="w-64 gap-3 bg-[#1b1b1b] p-3 text-[#ecece8] ring-white/10"
					>
						<PopoverTitle>
							{hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
						</PopoverTitle>
						<form
							className="space-y-3"
							onSubmit={async (event) => {
								event.preventDefault();
								try {
									await save();
									setHasPassword(await changeNotePassword(id, secret));
									setSecret("");
									setSetting(false);
									setStatus("비밀번호 저장 완료");
								} catch (error) {
									setStatus(
										error instanceof Error
											? error.message
											: "비밀번호 저장 실패",
									);
								}
							}}
						>
							<Input
								type="text"
								className="note-secret border-[#333] bg-[#111]"
								value={secret}
								onChange={(event) => setSecret(event.target.value)}
								placeholder="새 비밀번호"
								aria-label="새 비밀번호"
								autoComplete="off"
								data-1p-ignore
								data-lpignore="true"
								data-form-type="other"
								autoFocus
								required
							/>
							<div className="flex items-center justify-end gap-2">
								{hasPassword && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="mr-auto text-[#aaa]"
										onClick={async () => {
											try {
												await save();
												await changeNotePassword(id, "");
												setHasPassword(false);
												setSecret("");
												setSetting(false);
												setStatus("비밀번호 제거 완료");
											} catch (error) {
												setStatus(
													error instanceof Error
														? error.message
														: "비밀번호 제거 실패",
												);
											}
										}}
									>
										비밀번호 제거
									</Button>
								)}
								<Button type="submit" size="sm">
									저장
								</Button>
							</div>
						</form>
					</PopoverContent>
				</Popover>
			</header>
			<textarea
				aria-label="노트 내용"
				className="min-h-0 flex-1 resize-none bg-transparent p-5 text-base leading-7 text-[#ecece8] outline-none md:p-8"
				value={content}
				onChange={(event) => {
					const value = event.target.value;
					setContent(value);
					pending.current = value;
					revision.current++;
					setStatus("수정됨");
					if (timer.current) clearTimeout(timer.current);
					timer.current = setTimeout(() => {
						void save().catch(() => undefined);
					}, 800);
				}}
				spellCheck={false}
			/>
		</main>
	);
}
