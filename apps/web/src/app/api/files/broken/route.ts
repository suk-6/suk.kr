import { fileScanOffsetSchema } from "@suk/contracts";
import { fileAuthorization } from "@/features/files/auth";
import { fileError } from "@/features/files/errors";
import { findObject } from "@/features/files/s3";
import { api } from "@/lib/api/client";

export async function GET(request: Request) {
	try {
		const denied = await fileAuthorization(request);
		if (denied) return denied;
		const offset = fileScanOffsetSchema.parse(
			new URL(request.url).searchParams.get("offset") || 0,
		);
		const mappings = (await api.files()).sort((a, b) =>
			a.id.localeCompare(b.id),
		);
		const files = [];
		for (const file of mappings.slice(offset, offset + 20))
			if (!(await findObject(file.objectKey))) files.push(file);
		return Response.json({
			files,
			nextOffset: offset + 20 < mappings.length ? offset + 20 : null,
		});
	} catch (error) {
		return fileError(error);
	}
}
