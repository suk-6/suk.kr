import { folderCreateSchema } from "@suk/contracts";
import { fileAuthorization } from "@/features/files/auth";
import { fileError } from "@/features/files/errors";
import { createFolder, listObjects } from "@/features/files/s3";
import { ApiError } from "@/lib/api/client";

export async function POST(request: Request) {
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const { prefix } = folderCreateSchema.parse(await request.json());
		if ((await listObjects(prefix, undefined, "", 1)).Contents?.length)
			throw new ApiError(409, "이미 존재하는 폴더입니다.");
		await createFolder(prefix);
		return new Response(null, { status: 204 });
	} catch (error) {
		return fileError(error);
	}
}
