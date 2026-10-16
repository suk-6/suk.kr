import { fileSigningSchema } from "@suk/contracts";
import { fileAuthorization } from "@/features/files/auth";
import { fileError } from "@/features/files/errors";
import { findObject, signUpload } from "@/features/files/s3";
import { ApiError } from "@/lib/api/client";

export async function POST(request: Request) {
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const { objectKey, contentType, overwrite, confirmation, etag } =
			fileSigningSchema.parse(await request.json());
		const existing = await findObject(objectKey);
		if (existing && !overwrite)
			throw new ApiError(
				409,
				"같은 키의 파일이 있습니다. 덮어쓰기를 확인하세요.",
			);
		if (overwrite && (!etag || existing?.ETag !== etag))
			throw new ApiError(
				409,
				"대상 객체가 변경되었습니다. 덮어쓰기를 다시 확인하세요.",
			);
		if (
			overwrite &&
			objectKey.startsWith("assets/") &&
			confirmation !== "assets/"
		)
			throw new ApiError(
				403,
				"라이브 포트폴리오 파일입니다. assets/를 입력하여 덮어쓰기를 확인하세요.",
			);
		const type = contentType || "application/octet-stream";
		return Response.json({
			objectKey,
			contentType: type,
			uploadUrl: await signUpload(objectKey, type, overwrite, etag),
			expiresAt: Date.now() + 600_000,
			headers: {
				"Content-Type": type,
				...(!overwrite ? { "If-None-Match": "*" } : { "If-Match": etag! }),
			},
		});
	} catch (error) {
		return fileError(error);
	}
}
