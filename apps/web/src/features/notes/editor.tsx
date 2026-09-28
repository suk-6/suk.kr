"use client";

import { useEffect, useRef, useState } from "react";
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
					className="w-full max-w-sm space-y-5"
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
					<p className="text-sm text-[#999]">note / {id}</p>
					<h1 className="text-xl">잠긴 노트</h1>
					<input
						type="text"
						className="note-secret w-full rounded border border-[#333] bg-[#161616] p-3 outline-none focus:border-[#777]"
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
					<button className="rounded bg-[#ecece8] px-4 py-2 text-sm text-[#090909]">
						열기
					</button>
				</form>
			</main>
		);

	return (
		<main className="flex h-svh flex-col bg-[#090909] font-mono text-[#ecece8]">
			<header className="flex min-h-14 flex-wrap items-center gap-4 border-b border-[#262626] px-5 py-3 text-sm">
				<span className="mr-auto">note / {id}</span>
				<span role="status" aria-live="polite" className="text-[#999]">
					{status}
				</span>
				{setting ? (
					<form
						className="flex items-center gap-2"
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
									error instanceof Error ? error.message : "비밀번호 저장 실패",
								);
							}
						}}
					>
						<input
							type="text"
							className="note-secret w-36 rounded border border-[#333] bg-[#161616] px-2 py-1 outline-none focus:border-[#777]"
							value={secret}
							onChange={(event) => setSecret(event.target.value)}
							placeholder="새 비밀번호"
							autoComplete="off"
							data-1p-ignore
							data-lpignore="true"
							data-form-type="other"
							required
						/>
						<button type="submit">저장</button>
						<button
							type="button"
							onClick={() => {
								setSecret("");
								setSetting(false);
							}}
						>
							취소
						</button>
					</form>
				) : (
					<>
						<button onClick={() => setSetting(true)}>
							{hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
						</button>
						{hasPassword && (
							<button
								onClick={async () => {
									try {
										await save();
										await changeNotePassword(id, "");
										setHasPassword(false);
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
								제거
							</button>
						)}
					</>
				)}
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
