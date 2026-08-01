"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFile } from "./actions";

export const FileUpload = () => {
	const [value, setValue] = useState({
		file: null as File | null,
		slug: "",
		fileName: "",
		status: "",
	});
	return (
		<form
			className="grid gap-3 md:grid-cols-2"
			onSubmit={async (event) => {
				event.preventDefault();
				if (!value.file) return;
				setValue({ ...value, status: "업로드 중…" });
				const signed = await fetch("/api/files/sign", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						slug: value.slug,
						fileName: value.fileName,
						contentType: value.file.type,
					}),
				});
				if (!signed.ok)
					return setValue({
						...value,
						status: ((await signed.json()) as { error: string }).error,
					});
				const { uploadUrl, objectKey } = (await signed.json()) as {
					uploadUrl: string;
					objectKey: string;
				};
				const uploaded = await fetch(uploadUrl, {
					method: "PUT",
					body: value.file,
					headers: {
						"Content-Type": value.file.type || "application/octet-stream",
					},
				});
				if (!uploaded.ok)
					return setValue({ ...value, status: "S3 업로드에 실패했습니다." });
				const data = new FormData();
				Object.entries({
					slug: value.slug,
					fileName: value.fileName,
					objectKey,
					contentType: value.file.type || "application/octet-stream",
					size: String(value.file.size),
				}).forEach(([key, item]) => {
					data.set(key, item);
				});
				await createFile(data);
				setValue({ file: null, slug: "", fileName: "", status: "완료" });
			}}
		>
			<label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-center md:col-span-2">
				<UploadCloud className="mb-2 text-zinc-400" />
				<span className="text-sm font-medium">
					{value.file?.name ?? "파일을 선택하거나 끌어오세요"}
				</span>
				<input
					className="hidden"
					type="file"
					onChange={(event) => {
						const file = event.target.files?.[0] ?? null;
						setValue({
							file,
							slug: file?.name ?? "",
							fileName: file?.name ?? "",
							status: "",
						});
					}}
				/>
			</label>
			<Input
				value={value.slug}
				onChange={(event) => setValue({ ...value, slug: event.target.value })}
				placeholder="slug"
				required
			/>
			<Input
				value={value.fileName}
				onChange={(event) =>
					setValue({ ...value, fileName: event.target.value })
				}
				placeholder="fileName"
				required
			/>
			<div className="flex items-center gap-3 md:col-span-2">
				<Button disabled={!value.file}>업로드</Button>
				<span className="text-sm text-zinc-500">{value.status}</span>
			</div>
		</form>
	);
};
