import { type FileOperationPlan, type StoredFile } from "@suk/contracts";
import { api, ApiError } from "@/lib/api/client";
import { findObject, folderObjects } from "./s3";
import "server-only";

export const operationObjects = async (objectKey: string) => {
	if (objectKey.endsWith("/")) {
		const objects = [];
		for await (const object of folderObjects(objectKey)) objects.push(object);
		return objects;
	}
	const object = await findObject(objectKey);
	return object
		? [{ Key: objectKey, Size: object.ContentLength, ETag: object.ETag }]
		: [];
};
export const operationPlan = async (
	objectKey: string,
): Promise<FileOperationPlan> => {
	const objects = (await operationObjects(objectKey)).map((object) => {
		if (!object.ETag)
			throw new ApiError(502, "S3가 ETag를 반환하지 않았습니다.");
		return {
			objectKey: object.Key!,
			etag: object.ETag,
			size: object.Size ?? 0,
		};
	});
	return {
		objects,
		count: objects.length,
		bytes: objects.reduce((sum, object) => sum + object.size, 0),
		requiresConfirmation: objectKey.startsWith("assets/"),
	};
};
export const reviewOperation = async (
	key: string,
	reviewed: FileOperationPlan["objects"],
) => {
	const current = await operationPlan(key);
	const expected = new Map(
		reviewed.map((object) => [object.objectKey, object]),
	);
	if (
		expected.size !== reviewed.length ||
		current.objects.length !== reviewed.length ||
		current.objects.some((object) => {
			const previous = expected.get(object.objectKey);
			return (
				!previous ||
				previous.etag !== object.etag ||
				previous.size !== object.size
			);
		})
	)
		throw new ApiError(
			409,
			"객체가 변경되었습니다. 목록과 작업 내용을 다시 확인하세요.",
		);
	return current.objects;
};
export const confirmOperation = (
	key: string,
	confirmation?: string,
	destination?: string,
) => {
	if (
		(key.startsWith("assets/") || destination?.startsWith("assets/")) &&
		confirmation !== "assets/"
	)
		throw new ApiError(
			403,
			"라이브 포트폴리오에 영향을 줍니다. assets/를 입력하여 확인하세요.",
		);
};
export const removeMapping = async (file: StoredFile | undefined) => {
	if (!file) return;
	try {
		await api.mutate(`/files/${encodeURIComponent(file.id)}`, "DELETE", {
			objectKey: file.objectKey,
		});
	} catch (error) {
		if (!(error instanceof ApiError && error.status === 404)) throw error;
	}
};
