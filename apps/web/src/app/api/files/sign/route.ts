import { linkSchema } from "@suk/contracts";
import { signUpload } from "@/features/files/s3";
import { api } from "@/lib/api/client";
import { isAdmin } from "@/lib/auth/session";

export async function POST(request: Request) {
	if (!(await isAdmin()))
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	const body = (await request.json()) as {
		slug?: string;
		fileName?: string;
		contentType?: string;
	};
	const slug = linkSchema.shape.slug.parse(body.slug);
	const fileName = String(body.fileName ?? "").trim();
	if (!fileName)
		return Response.json({ error: "파일명이 필요합니다." }, { status: 400 });
	const [links, files] = await Promise.all([api.links(), api.files()]);
	if (
		links.some((link) => link.slug === slug) ||
		files.some((file) => file.objectKey === fileName)
	)
		return Response.json(
			{ error: "같은 slug 또는 파일명이 이미 있습니다." },
			{ status: 409 },
		);
	return Response.json({
		objectKey: fileName,
		uploadUrl: await signUpload(
			fileName,
			body.contentType || "application/octet-stream",
		),
	});
}
