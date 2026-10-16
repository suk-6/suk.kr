import { fileSchema, fileSlugSchema, type StoredFile } from "@suk/contracts";
import { revalidatePath } from "next/cache";
import { fileAuthorization } from "@/features/files/auth";
import { fileError } from "@/features/files/errors";
import { headObject, publicObjectUrl } from "@/features/files/s3";
import { removeMapping } from "@/features/files/operations";
import { api, ApiError } from "@/lib/api/client";

// A row exists only when the admin chooses a short-link slug.
export async function POST(request: Request) {
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const input = fileSlugSchema.parse(await request.json());
		if (input.slug === null) {
			try {
				await removeMapping(await api.file(input.id));
			} catch (error) {
				if (!(error instanceof ApiError && error.status === 404)) throw error;
			}
			revalidatePath("/admin");
			return new Response(null, { status: 204 });
		}
		const { objectKey, slug } = input;
		const current = (await api.files()).find(
			(file) => file.objectKey === objectKey,
		);
		const object = await headObject(objectKey);
		const value = fileSchema.parse({
			id: current?.id ?? crypto.randomUUID(),
			slug,
			objectKey,
			fileName: objectKey.split("/").at(-1),
			size: object.ContentLength ?? 0,
			contentType: object.ContentType || "application/octet-stream",
			publicUrl: publicObjectUrl(objectKey),
			createdAt:
				current?.createdAt ??
				object.LastModified?.toISOString() ??
				new Date().toISOString(),
		});
		const file = await api.mutate<StoredFile>("/files", "POST", value);
		revalidatePath("/admin");
		return Response.json(file);
	} catch (error) {
		return fileError(error);
	}
}
