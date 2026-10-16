import {
	fileDeleteSchema,
	fileMoveSchema,
	folderPrefixSchema,
} from "@suk/contracts";
import { revalidatePath } from "next/cache";
import { fileAuthorization } from "@/features/files/auth";
import { fileError } from "@/features/files/errors";
import {
	confirmOperation,
	reviewOperation,
	removeMapping,
} from "@/features/files/operations";
import {
	copyObject,
	deleteObject,
	findObject,
	listObjects,
	publicObjectUrl,
} from "@/features/files/s3";
import { api, ApiError } from "@/lib/api/client";

export const maxDuration = 300;

export async function GET(request: Request) {
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const query = new URL(request.url).searchParams;
		const prefix = folderPrefixSchema.parse(query.get("prefix") || "");
		const [page, files] = await Promise.all([
			listObjects(prefix, query.get("token") || undefined),
			api.files(),
		]);
		const mappings = new Map(files.map((file) => [file.objectKey, file]));
		const objects = [];
		const contents = (page.Contents ?? []).filter(
			(object) => object.Key && object.Key !== prefix,
		);
		// HEAD provides the content type absent from ListObjectsV2. Bound concurrency.
		for (let index = 0; index < contents.length; index += 10) {
			const chunk = await Promise.all(
				contents.slice(index, index + 10).map(async (object) => {
					const key = object.Key!;
					const metadata = await findObject(key);
					if (!metadata) return null; // It may have been deleted after LIST.
					return {
						objectKey: key,
						size: metadata.ContentLength ?? object.Size ?? 0,
						lastModified: metadata.LastModified?.toISOString() ?? null,
						contentType: metadata.ContentType || "application/octet-stream",
						publicUrl: publicObjectUrl(key),
						mapping: mappings.get(key) ?? null,
					};
				}),
			);
			objects.push(...chunk.filter((object) => object !== null));
		}
		return Response.json({
			prefix,
			folders: (page.CommonPrefixes ?? []).flatMap((folder) =>
				folder.Prefix ? [folder.Prefix] : [],
			),
			objects,
			nextToken: page.IsTruncated ? (page.NextContinuationToken ?? null) : null,
		});
	} catch (error) {
		return fileError(error);
	}
}

export async function DELETE(request: Request) {
	let count = 0;
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const {
			objectKey,
			objects: reviewed,
			confirmation,
		} = fileDeleteSchema.parse(await request.json());
		confirmOperation(objectKey, confirmation);
		const [objects, files] = await Promise.all([
			reviewOperation(objectKey, reviewed),
			api.files(),
		]);
		const mappings = new Map(files.map((file) => [file.objectKey, file]));
		for (const object of objects) {
			await deleteObject(object.objectKey, object.etag);
			count++;
			await removeMapping(mappings.get(object.objectKey));
		}
		// Also remove broken mappings within the confirmed deleted folder/file.
		for (const file of files)
			if (
				(file.objectKey === objectKey ||
					(objectKey.endsWith("/") && file.objectKey.startsWith(objectKey))) &&
				!objects.some((object) => object.objectKey === file.objectKey)
			)
				await removeMapping(file);
		revalidatePath("/admin");
		return Response.json({ count });
	} catch (error) {
		revalidatePath("/admin");
		if (count)
			return Response.json(
				{
					error: `${count}개를 삭제한 후 중단되었습니다. 목록과 끊어진 링크를 새로고침하여 남은 항목을 확인하세요.`,
				},
				{ status: 502 },
			);
		return fileError(error);
	}
}

export async function PATCH(request: Request) {
	let count = 0;
	let copying: string | null = null;
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const {
			objectKey,
			destinationKey,
			objects: reviewed,
			confirmation,
		} = fileMoveSchema.parse(await request.json());
		confirmOperation(objectKey, confirmation, destinationKey);
		const [objects, files] = await Promise.all([
			reviewOperation(objectKey, reviewed),
			api.files(),
		]);
		if (!objects.length) throw new ApiError(404, "이동할 객체가 없습니다.");
		if (objects.some((object) => object.size > 5 * 1024 ** 3))
			throw new ApiError(
				400,
				"5GB가 넘는 객체 이동은 지원하지 않습니다. S3 관리 도구에서 이동하세요.",
			);
		const mappings = new Map(files.map((file) => [file.objectKey, file]));
		for (const object of objects) {
			const source = object.objectKey;
			const target = objectKey.endsWith("/")
				? destinationKey + source.slice(objectKey.length)
				: destinationKey;
			const existing = await findObject(target);
			if (existing) {
				if (
					existing.ETag !== object.etag ||
					existing.ContentLength !== object.size
				)
					throw new ApiError(
						409,
						"대상 객체의 내용이 다릅니다. 다른 경로를 선택하세요.",
					);
			} else {
				if (files.some((file) => file.objectKey === target))
					throw new ApiError(
						409,
						"대상 키에 끊어진 단축 링크가 있습니다. 먼저 확인하세요.",
					);
				copying = target;
				await copyObject(source, target, object.etag);
			}
			copying = target;
			const mapping = mappings.get(source);
			if (mapping)
				await api.mutate(`/files/${encodeURIComponent(mapping.id)}`, "PATCH", {
					slug: mapping.slug,
					fileName: target.split("/").at(-1),
					objectKey: target,
					publicUrl: publicObjectUrl(target),
				});
			// Do not remove source bytes until the mapping points at the copied object.
			await deleteObject(source, object.etag);
			count++;
			copying = null;
		}
		revalidatePath("/admin");
		return Response.json({ count });
	} catch (error) {
		revalidatePath("/admin");
		if (count || copying)
			return Response.json(
				{
					error: `${count}개를 이동한 후 중단되었습니다. ${copying ? `대상 ${copying}에 복사본이 남아 있을 수 있습니다.` : ""} 두 폴더와 끊어진 링크를 확인하세요. 원본은 복사와 링크 저장 후에만 삭제됩니다.`,
				},
				{ status: 502 },
			);
		return fileError(error);
	}
}
