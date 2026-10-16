"use client";

import { folderCreateSchema, type StorageObjects } from "@suk/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { fileRequest } from "@/features/files/client";
import { BrokenLinks } from "./broken";
import { FileRow } from "./row";
import { FileUpload } from "./upload";

export const FileBrowser = () => {
	const [prefix, setPrefix] = useState("");
	const [page, setPage] = useState<StorageObjects | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [revision, setRevision] = useState(0);
	const [pending, setPending] = useState(true);
	const [error, setError] = useState("");
	const [folderName, setFolderName] = useState("");
	const [creating, setCreating] = useState(false);
	const [folderMessage, setFolderMessage] = useState("");
	const [folderError, setFolderError] = useState(false);
	const creatingRef = useRef(false);
	const refresh = useCallback(() => {
		setPending(true);
		setError("");
		setToken(null);
		setRevision((value) => value + 1);
	}, []);
	useEffect(() => {
		let active = true;
		const query = new URLSearchParams({ prefix, token: token ?? "" });
		fileRequest<StorageObjects>(`/api/files/objects?${query}`)
			.then((result) => {
				if (!active) return;
				setPage((current) =>
					token && current?.prefix === result.prefix
						? {
								...result,
								folders: [...new Set([...current.folders, ...result.folders])],
								objects: [
									...current.objects,
									...result.objects.filter(
										(object) =>
											!current.objects.some(
												(existing) => existing.objectKey === object.objectKey,
											),
									),
								],
							}
						: result,
				);
			})
			.catch((error: unknown) => {
				if (active)
					setError(
						error instanceof Error
							? error.message
							: "S3 목록을 가져오지 못했습니다.",
					);
			})
			.finally(() => {
				if (active) setPending(false);
			});
		return () => {
			active = false;
		};
	}, [prefix, token, revision]);
	const openFolder = (value: string) => {
		if (value === prefix) return;
		setPrefix(value);
		setPage(null);
		setFolderName("");
		setFolderMessage("");
		refresh();
	};
	const segments = prefix.slice(0, -1).split("/");
	return (
		<>
			<Card>
				<CardHeader>
					<h2 className="font-semibold">S3 파일 및 폴더</h2>
					<p className="text-sm text-muted-foreground">
						assets/를 포함한 모든 객체를 표시합니다. 단축 링크는 선택
						사항입니다.
					</p>
					<nav
						aria-label="현재 폴더"
						className="flex flex-wrap items-center gap-1 text-sm"
					>
						<Button
							type="button"
							variant="link"
							size="sm"
							disabled={pending || creating || !prefix}
							onClick={() => openFolder("")}
						>
							루트
						</Button>
						{prefix &&
							segments.map((name, index) => {
								const path = segments.slice(0, index + 1).join("/") + "/";
								return (
									<span
										key={path}
										className="flex max-w-full items-center gap-1"
									>
										<span aria-hidden="true">/</span>
										{path === prefix ? (
											<span aria-current="page" className="break-all">
												{name}
											</span>
										) : (
											<Button
												type="button"
												variant="link"
												size="sm"
												disabled={pending || creating}
												onClick={() => openFolder(path)}
											>
												{name}
											</Button>
										)}
									</span>
								);
							})}
					</nav>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="flex flex-wrap items-center gap-3">
						<Button
							type="button"
							variant="outline"
							disabled={pending || creating}
							onClick={refresh}
						>
							{pending ? "목록 불러오는 중…" : "새로고침"}
						</Button>
						<p className="break-all text-sm text-muted-foreground">/{prefix}</p>
					</div>
					<form
						className="flex flex-wrap items-end gap-2"
						onSubmit={async (event) => {
							event.preventDefault();
							if (creatingRef.current) return;
							creatingRef.current = true;
							setCreating(true);
							setFolderMessage("");
							setFolderError(false);
							try {
								if (!folderName.trim() || folderName.includes("/"))
									throw new Error(
										"하위 폴더 이름 하나를 입력하세요. /는 붙이지 마세요.",
									);
								await fileRequest(
									"/api/files/folders",
									"POST",
									folderCreateSchema.parse({
										prefix: prefix + folderName + "/",
									}),
								);
								setFolderName("");
								setFolderMessage("폴더를 만들었습니다.");
								refresh();
							} catch (error) {
								setFolderError(true);
								setFolderMessage(
									error instanceof Error
										? error.message
										: "폴더를 만들지 못했습니다.",
								);
							} finally {
								creatingRef.current = false;
								setCreating(false);
							}
						}}
					>
						<label className="min-w-0 flex-1 space-y-1 text-sm">
							새 하위 폴더
							<Input
								value={folderName}
								disabled={creating}
								required
								onChange={(event) => setFolderName(event.target.value)}
								placeholder="폴더 이름"
							/>
						</label>
						<Button
							type="submit"
							disabled={pending || creating || !folderName.trim()}
						>
							{creating ? "만드는 중…" : "폴더 만들기"}
						</Button>
					</form>
					{folderMessage && (
						<p
							role={folderError ? "alert" : "status"}
							className={`text-sm ${folderError ? "text-destructive" : "text-muted-foreground"}`}
						>
							{folderMessage}
						</p>
					)}
					<Separator />
					<h3 className="text-sm font-medium">현재 폴더에 업로드</h3>
					<FileUpload prefix={prefix} onChanged={refresh} />
					<Separator />
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					{pending && (
						<p role="status" className="text-sm text-muted-foreground">
							폴더 목록을 불러오는 중…
						</p>
					)}
					{page && (
						<p role="status" className="text-sm text-muted-foreground">
							폴더 {page.folders.length}개 · 파일 {page.objects.length}개
							{page.nextToken ? " · 다음 페이지 있음" : ""}
						</p>
					)}
					{page?.folders.map((folder) => (
						<FileRow
							key={folder}
							objectKey={folder}
							onOpen={() => {
								if (!pending && !creating) openFolder(folder);
							}}
							onChanged={refresh}
						/>
					))}
					{page?.objects.map((object) => (
						<FileRow
							key={`${object.objectKey}:${object.lastModified}:${object.mapping?.updatedAt ?? ""}`}
							objectKey={object.objectKey}
							object={object}
							onChanged={refresh}
						/>
					))}
					{page && !pending && !page.folders.length && !page.objects.length && (
						<p className="text-sm text-muted-foreground">
							이 폴더는 비어 있습니다.
						</p>
					)}
					{page?.nextToken && (
						<Button
							type="button"
							variant="outline"
							disabled={pending || creating}
							onClick={() => {
								setPending(true);
								setError("");
								setToken(page.nextToken);
								setRevision((value) => value + 1);
							}}
						>
							더 불러오기
						</Button>
					)}
				</CardContent>
			</Card>
			<BrokenLinks onChanged={refresh} />
		</>
	);
};
