import { fileSchema } from "@suk/contracts";
import { objectExists, signUpload } from "@/features/files/s3";
import { api } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/session";

export async function POST(request: Request) {
	if (!(await isAdmin()))
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	const value = fileSchema
		.pick({ slug: true, fileName: true, contentType: true })
		.safeParse(await request.json().catch(() => null));
	if (!value.success)
		return Response.json(
			{ error: "잘못된 업로드 요청입니다." },
			{ status: 400 },
		);
	const { slug, fileName } = value.data;
	const contentType = value.data.contentType || "application/octet-stream";
	const [links, files, occupied] = await Promise.all([
		api.links(),
		api.files(),
		objectExists(fileName),
	]);
	if (
		links.some((link) => link.slug === slug) ||
		files.some((file) => file.objectKey === fileName) ||
		occupied
	)
		return Response.json(
			{ error: "같은 slug 또는 파일명이 이미 있습니다." },
			{ status: 409 },
		);
	return Response.json({
		objectKey: fileName,
		uploadUrl: await signUpload(fileName, contentType),
	});
}
